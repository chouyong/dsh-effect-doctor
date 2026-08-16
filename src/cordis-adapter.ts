import {
  type AuditAdapter,
  type AuditPhase,
  type ErrorSummary,
  type ResourceRecord,
  type ResourceSnapshot,
  type RuntimeIdentity,
  type SupportFailure,
  type SupportResult,
  SUPPORTED_RUNTIME,
} from './contracts.js'

interface EffectMetaLike {
  label: string
  children: EffectMetaLike[]
}

interface FiberLike {
  uid: number | null
  state: number
  name: string
  dispose(): void | Promise<void>
  getEffects(): EffectMetaLike[]
}

interface RuntimeLike {
  name?: string
  fibers: Iterable<FiberLike>
}

interface RegistryLike {
  size: number
  entries(): Iterable<[Function, RuntimeLike]>
  plugin(plugin: unknown): FiberLike & PromiseLike<FiberLike>
}

interface HookLike {
  ctx: {
    fiber: FiberLike
  }
}

interface ImplLike {
  name: string
  fiber: FiberLike
}

interface LoggerMessageLike {
  sn: number
  type: string
  args: unknown[]
}

export interface CordisContextLike {
  fiber: FiberLike
  registry: RegistryLike
  events: {
    _hooks: Record<PropertyKey, HookLike[]>
  }
  reflect: {
    store: Record<PropertyKey, ImplLike>
  }
  logger: {
    buffer: LoggerMessageLike[]
  }
}

const STATE_LABELS = [
  'pending',
  'loading',
  'active',
  'failed',
  'disposed',
  'unloading',
] as const

export class AdapterSurfaceError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'AdapterSurfaceError'
  }
}

function supportFailure(
  outcome: SupportFailure['outcome'],
  reason: string,
): SupportFailure {
  return { supported: false, outcome, reason }
}

function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  return (typeof value === 'object' && value !== null) || typeof value === 'function'
}

function hasFunction(value: unknown, key: PropertyKey): boolean {
  return isObject(value) && typeof value[key] === 'function'
}

function fiberOwner(fiber: FiberLike): string {
  return fiber.uid === 0 ? 'fiber:root' : `fiber:${String(fiber.uid)}`
}

function stateLabel(state: number): string {
  const label = STATE_LABELS[state]
  if (label === undefined) {
    throw new AdapterSurfaceError('fiber state is outside the pinned Cordis 4.0.1 enum')
  }
  return label
}

function propertyLabel(value: PropertyKey): string {
  if (typeof value === 'symbol') return value.description ?? 'symbol'
  return String(value)
}

function effectResources(
  effects: EffectMetaLike[],
  owner: string,
  path: string[] = [],
): ResourceRecord[] {
  const resources: ResourceRecord[] = []
  for (const [index, effect] of effects.entries()) {
    if (!isObject(effect) || typeof effect.label !== 'string' || !Array.isArray(effect.children)) {
      throw new AdapterSurfaceError('effect metadata differs from the pinned Cordis 4.0.1 structure')
    }
    const nextPath = [...path, `${index}:${effect.label}`]
    resources.push({
      category: 'effect',
      identity: `${owner}:effect:${nextPath.join('/')}`,
      label: effect.label,
      owner,
    })
    resources.push(...effectResources(effect.children, owner, nextPath))
  }
  return resources
}

function fiberResources(fiber: FiberLike): ResourceRecord[] {
  const owner = fiberOwner(fiber)
  const effects = fiber.getEffects()
  if (!Array.isArray(effects)) {
    throw new AdapterSurfaceError('Fiber.getEffects() did not return an array')
  }
  return [
    {
      category: 'fiber',
      identity: owner,
      label: fiber.name,
      owner,
      state: stateLabel(fiber.state),
    },
    ...effectResources(effects, owner),
  ]
}

function sortResources(resources: ResourceRecord[]): ResourceRecord[] {
  return resources.sort((left, right) => {
    return left.category.localeCompare(right.category)
      || left.identity.localeCompare(right.identity)
      || left.label.localeCompare(right.label)
      || left.owner.localeCompare(right.owner)
      || (left.state ?? '').localeCompare(right.state ?? '')
  })
}

function errorName(value: unknown): string {
  if (value instanceof Error && value.name.trim() !== '') return value.name
  return 'LoggedError'
}

function errorCode(value: unknown): string | undefined {
  if (!isObject(value) || typeof value.code !== 'string') return
  if (!/^[A-Z][A-Z0-9_]{0,63}$/.test(value.code)) return
  return value.code
}

export class CordisV401Adapter implements AuditAdapter<CordisContextLike, FiberLike> {
  probe(context: CordisContextLike, runtime: RuntimeIdentity): SupportResult {
    if (
      runtime.packageName !== SUPPORTED_RUNTIME.packageName
      || runtime.packageVersion !== SUPPORTED_RUNTIME.packageVersion
    ) {
      return supportFailure(
        'UNVERIFIABLE_VERSION',
        `supported runtime is ${SUPPORTED_RUNTIME.packageName}@${SUPPORTED_RUNTIME.packageVersion}`,
      )
    }
    if (!isObject(context)) {
      return supportFailure('UNVERIFIABLE_SURFACE', 'context is not an object')
    }
    if (!hasFunction(context.registry, 'entries') || !hasFunction(context.registry, 'plugin')) {
      return supportFailure('UNVERIFIABLE_SURFACE', 'registry map or mount methods are unavailable')
    }
    if (typeof context.registry.size !== 'number') {
      return supportFailure('UNVERIFIABLE_SURFACE', 'registry size is unavailable')
    }
    if (!hasFunction(context.fiber, 'dispose') || !hasFunction(context.fiber, 'getEffects')) {
      return supportFailure('UNVERIFIABLE_SURFACE', 'root fiber lifecycle methods are unavailable')
    }
    if (!isObject(context.events) || !isObject(context.events._hooks)) {
      return supportFailure('UNVERIFIABLE_SURFACE', 'event hook projection is unavailable')
    }
    if (!isObject(context.reflect) || !isObject(context.reflect.store)) {
      return supportFailure('UNVERIFIABLE_SURFACE', 'service provider projection is unavailable')
    }
    if (!isObject(context.logger) || !Array.isArray(context.logger.buffer)) {
      return supportFailure('UNVERIFIABLE_SURFACE', 'logger error cursor is unavailable')
    }
    return { supported: true }
  }

  snapshot(context: CordisContextLike, phase: AuditPhase): ResourceSnapshot {
    const resources = fiberResources(context.fiber)
    const seenFibers = new Set<number | null>([context.fiber.uid])

    let runtimeIndex = 0
    for (const [callback, runtime] of context.registry.entries()) {
      if (!isObject(runtime) || !runtime.fibers || typeof runtime.fibers[Symbol.iterator] !== 'function') {
        throw new AdapterSurfaceError('registry runtime fibers are not iterable')
      }
      const name = runtime.name ?? callback.name ?? 'anonymous'
      const runtimeIdentity = `runtime:${runtimeIndex}:${name}`
      resources.push({
        category: 'runtime',
        identity: runtimeIdentity,
        label: name,
        owner: 'registry',
      })
      for (const fiber of runtime.fibers) {
        if (seenFibers.has(fiber.uid)) {
          throw new AdapterSurfaceError('duplicate fiber identity found in registry snapshot')
        }
        seenFibers.add(fiber.uid)
        resources.push(...fiberResources(fiber))
      }
      runtimeIndex += 1
    }

    for (const key of Reflect.ownKeys(context.events._hooks)) {
      const hooks = context.events._hooks[key]
      if (!Array.isArray(hooks)) {
        throw new AdapterSurfaceError('event hook collection is not an array')
      }
      for (const [index, hook] of hooks.entries()) {
        if (!isObject(hook) || !isObject(hook.ctx) || !isObject(hook.ctx.fiber)) {
          throw new AdapterSurfaceError('event hook owner differs from the pinned structure')
        }
        const owner = fiberOwner(hook.ctx.fiber as unknown as FiberLike)
        const label = propertyLabel(key)
        resources.push({
          category: 'listener',
          identity: `${owner}:listener:${label}:${index}`,
          label,
          owner,
        })
      }
    }

    for (const key of Reflect.ownKeys(context.reflect.store)) {
      const impl = context.reflect.store[key]
      if (!isObject(impl) || typeof impl.name !== 'string' || !isObject(impl.fiber)) {
        throw new AdapterSurfaceError('service provider differs from the pinned structure')
      }
      const owner = fiberOwner(impl.fiber as unknown as FiberLike)
      resources.push({
        category: 'service',
        identity: `${owner}:service:${impl.name}`,
        label: impl.name,
        owner,
      })
    }

    return { phase, resources: sortResources(resources) }
  }

  mount(context: CordisContextLike, plugin: unknown): FiberLike & PromiseLike<FiberLike> {
    return context.registry.plugin(plugin)
  }

  async dispose(fiber: FiberLike): Promise<void> {
    await fiber.dispose()
  }

  errorCursor(context: CordisContextLike): number {
    return context.logger.buffer.at(-1)?.sn ?? 0
  }

  errorsSince(
    context: CordisContextLike,
    cursor: number,
    phase: AuditPhase,
  ): ErrorSummary[] {
    return context.logger.buffer
      .filter(message => message.sn > cursor && message.type === 'error')
      .map((message) => {
        const first = message.args[0]
        const code = errorCode(first)
        return {
          phase,
          name: errorName(first),
          ...(code === undefined ? {} : { code }),
        }
      })
  }
}
