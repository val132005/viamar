export const PERSIST_VERSION = 4
export const PERSIST_PREFIX = 'viamar-baterias-v4'

export function persistName(slice: string) {
  return `${PERSIST_PREFIX}-${slice}`
}

export function clearPersistedDemo() {
  const prefixes = [
    'viamar-baterias-v1',
    'viamar-baterias-v2',
    'viamar-baterias-v3',
    'viamar-baterias-v4',
  ]
  for (const key of Object.keys(localStorage)) {
    if (prefixes.some((p) => key.startsWith(p))) localStorage.removeItem(key)
  }
}
