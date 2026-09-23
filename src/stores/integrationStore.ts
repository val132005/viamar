import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EventoIntegracion } from '../domain/entities'
import { persistName, PERSIST_VERSION } from './persist'

type IntegrationState = {
  eventos: EventoIntegracion[]
  load: (eventos: EventoIntegracion[]) => void
  reintentar: (id: string) => void
}

export const useIntegrationStore = create<IntegrationState>()(
  persist(
    (set) => ({
      eventos: [],
      load: (eventos) => set({ eventos }),
      reintentar: (id) =>
        set((s) => ({
          eventos: s.eventos.map((e) =>
            e.id === id ? { ...e, estado: 'pendiente', intentos: e.intentos + 1 } : e,
          ),
        })),
    }),
    {
      name: persistName('integration'),
      version: PERSIST_VERSION,
      partialize: (s) => ({ eventos: s.eventos }),
    },
  ),
)
