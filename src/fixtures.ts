import type { AuditFixture } from './contracts.js'

interface FixtureFiber extends PromiseLike<void> {
  dispose(): void | Promise<void>
}

interface FixtureContext {
  root: FixtureContext
  effect(
    execute: () => void | (() => void | Promise<void>) | Promise<void | (() => void | Promise<void>)>,
    label?: string,
  ): () => void | Promise<void>
  on(
    name: string,
    listener: (...args: unknown[]) => unknown,
    options?: boolean | { global?: boolean; prepend?: boolean },
  ): () => boolean
  emit(name: string, ...args: unknown[]): void
  provide(name: string, value?: unknown): () => void
  plugin(plugin: (context: FixtureContext) => unknown): FixtureFiber
}

export type FixtureName =
  | 'clean'
  | 'leaky'
  | 'throwing-disposer'
  | 'hanging-disposer'
  | 'startup-failure'
  | 'unknown-version'

export const FIXTURE_NAMES: readonly FixtureName[] = [
  'clean',
  'leaky',
  'throwing-disposer',
  'hanging-disposer',
  'startup-failure',
  'unknown-version',
]

function managedTimer(context: FixtureContext, label: string): void {
  context.effect(() => {
    const timer = setTimeout(() => undefined, 5_000)
    return () => clearTimeout(timer)
  }, label)
}

async function cleanPlugin(context: FixtureContext): Promise<void> {
  context.effect(() => () => undefined, 'doctor.fixture.clean.effect')
  context.on('doctor/fixture-local', () => undefined)
  context.on('doctor/fixture-global', () => undefined, { global: true })
  context.provide('doctorFixtureService', { mode: 'clean' })
  managedTimer(context, 'doctor.fixture.clean.timer')
  const nested = context.plugin(function doctorNestedClean(child) {
    child.effect(() => () => undefined, 'doctor.fixture.clean.nested-effect')
    child.on('doctor/fixture-nested', () => undefined)
  })
  await nested
}

async function leakyPlugin(context: FixtureContext): Promise<void> {
  context.effect(() => () => undefined, 'doctor.fixture.leaky.target-effect')
  const leaked = context.root.plugin(function doctorIntentionallyLeakedSibling(child) {
    child.effect(() => () => undefined, 'doctor.fixture.leaky.retained-effect')
    child.on('doctor/fixture-leaked-listener', () => undefined)
    child.provide('doctorLeakedService', { retained: true })
  })
  await leaked
}

function throwingDisposerPlugin(context: FixtureContext): void {
  context.effect(() => () => {
    throw new Error('doctor fixture disposer failed')
  }, 'doctor.fixture.throwing-disposer')
}

function hangingDisposerPlugin(context: FixtureContext): void {
  context.effect(() => () => new Promise<void>(() => undefined), 'doctor.fixture.hanging-disposer')
}

function startupFailurePlugin(): never {
  throw new Error('doctor fixture startup failed')
}

function cleanExercise(context: FixtureContext): void {
  context.emit('doctor/fixture-local', { probe: true })
  context.emit('doctor/fixture-global', { probe: true })
  context.emit('doctor/fixture-nested', { probe: true })
}

const FIXTURES: Record<FixtureName, AuditFixture<FixtureContext>> = {
  clean: {
    name: 'clean',
    plugin: cleanPlugin,
    exercise: cleanExercise,
  },
  leaky: {
    name: 'leaky',
    plugin: leakyPlugin,
  },
  'throwing-disposer': {
    name: 'throwing-disposer',
    plugin: throwingDisposerPlugin,
  },
  'hanging-disposer': {
    name: 'hanging-disposer',
    plugin: hangingDisposerPlugin,
  },
  'startup-failure': {
    name: 'startup-failure',
    plugin: startupFailurePlugin,
  },
  'unknown-version': {
    name: 'unknown-version',
    plugin: cleanPlugin,
  },
}

export function getFixture(name: string): AuditFixture<FixtureContext> {
  if (!FIXTURE_NAMES.includes(name as FixtureName)) {
    throw new RangeError('fixture name is not supported')
  }
  return FIXTURES[name as FixtureName]
}
