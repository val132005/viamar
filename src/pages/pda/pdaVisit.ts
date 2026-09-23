export type PdaVisit = {
  dealerId: string
  seen: string[]
  diagnosticos: Record<string, string>
}

const KEY = 'viamar-pda-visit'

export function loadPdaVisit(defaultDealerId: string): PdaVisit {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { dealerId: defaultDealerId, seen: [], diagnosticos: {} }
    const parsed = JSON.parse(raw) as Partial<PdaVisit>
    return {
      dealerId: typeof parsed.dealerId === 'string' ? parsed.dealerId : defaultDealerId,
      seen: Array.isArray(parsed.seen) ? parsed.seen : [],
      diagnosticos:
        parsed.diagnosticos && typeof parsed.diagnosticos === 'object' ? parsed.diagnosticos : {},
    }
  } catch {
    return { dealerId: defaultDealerId, seen: [], diagnosticos: {} }
  }
}

export function savePdaVisit(visit: PdaVisit): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(visit))
  } catch {
    /* almacenamiento no disponible en el dispositivo */
  }
}

export function clearPdaVisit(dealerId: string): void {
  savePdaVisit({ dealerId, seen: [], diagnosticos: {} })
}
