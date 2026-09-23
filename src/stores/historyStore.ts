import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EventoHistorico, EventoTipo, OrigenRegistro } from '../domain/entities'
import { useAuthStore } from './authStore'
import { persistName, PERSIST_VERSION } from './persist'

type HistoryState = {
  eventos: EventoHistorico[]
  load: (eventos: EventoHistorico[]) => void
  registrar: (e: Omit<EventoHistorico, 'id'>) => EventoHistorico
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      eventos: [],
      load: (eventos) => set({ eventos }),
      registrar: (e) => {
        const event: EventoHistorico = { ...e, id: `ev-${crypto.randomUUID()}` }
        set({ eventos: [...get().eventos, event] })
        return event
      },
    }),
    { name: persistName('history'), version: PERSIST_VERSION, partialize: (s) => ({ eventos: s.eventos }) },
  ),
)

export function withHistory<T>(
  serial: string,
  tipo: EventoTipo,
  descripcion: string,
  mutate: () => T,
  extra?: Partial<Pick<EventoHistorico, 'referenciaId' | 'estadoAnterior' | 'estadoNuevo' | 'origen'>>,
): T {
  const result = mutate()
  const usuarioId = useAuthStore.getState().usuarioActual?.id ?? 'sistema'
  useHistoryStore.getState().registrar({
    serial,
    tipo,
    fecha: new Date().toISOString(),
    usuarioId,
    descripcion,
    origen: (extra?.origen ?? 'MANUAL') as OrigenRegistro,
    referenciaId: extra?.referenciaId,
    estadoAnterior: extra?.estadoAnterior,
    estadoNuevo: extra?.estadoNuevo,
  })
  return result
}
