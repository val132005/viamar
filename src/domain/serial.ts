export function normalizeSerial(raw: string): string {
  const compact = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (/^CIB-?\d+$/.test(compact)) {
    return compact.startsWith('CIB-') ? compact : `CIB-${compact.replace(/^CIB/, '')}`
  }
  return compact
}

export function isSerialQuery(raw: string): boolean {
  return /^CIB-?\d+$/i.test(raw.trim().replace(/\s+/g, ''))
}
