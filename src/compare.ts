import {
  type ResourceRecord,
  type ResourceSnapshot,
  type SnapshotDelta,
} from './contracts.js'

function resourceKey(resource: ResourceRecord): string {
  return JSON.stringify([
    resource.category,
    resource.identity,
    resource.label,
    resource.owner,
    resource.state ?? null,
  ])
}

export function compareSnapshots(
  baseline: ResourceSnapshot,
  current: ResourceSnapshot,
): SnapshotDelta {
  const before = new Map(baseline.resources.map(resource => [resourceKey(resource), resource]))
  const after = new Map(current.resources.map(resource => [resourceKey(resource), resource]))
  return {
    added: [...after]
      .filter(([key]) => !before.has(key))
      .map(([, resource]) => resource),
    removed: [...before]
      .filter(([key]) => !after.has(key))
      .map(([, resource]) => resource),
  }
}

export function snapshotsEqual(
  left: ResourceSnapshot,
  right: ResourceSnapshot,
): boolean {
  if (left.resources.length !== right.resources.length) return false
  return left.resources.every((resource, index) => {
    const other = right.resources[index]
    return other !== undefined && resourceKey(resource) === resourceKey(other)
  })
}
