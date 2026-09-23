import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CentroCarga, Estacion, ProcesoCarga } from '../domain/entities'
import { persistName, PERSIST_VERSION } from './persist'

type ChargingState = {
  procesos: ProcesoCarga[]
  centros: CentroCarga[]
  estaciones: Estacion[]
  load: (data: Pick<ChargingState, 'procesos' | 'centros' | 'estaciones'>) => void
  upsertCentro: (centro: CentroCarga) => void
  removeCentro: (id: string) => void
  upsertEstacion: (estacion: Estacion) => void
  removeEstacion: (id: string) => void
  addProceso: (proceso: ProcesoCarga) => void
  updateProceso: (id: string, patch: Partial<ProcesoCarga>) => void
}

export const useChargingStore = create<ChargingState>()(
  persist(
    (set) => ({
      procesos: [],
      centros: [],
      estaciones: [],
      load: (data) => set(data),
      upsertCentro: (centro) =>
        set((s) => {
          const i = s.centros.findIndex((c) => c.id === centro.id)
          if (i < 0) return { centros: [...s.centros, centro] }
          const next = s.centros.slice()
          next[i] = centro
          return { centros: next }
        }),
      removeCentro: (id) => set((s) => ({ centros: s.centros.filter((c) => c.id !== id) })),
      upsertEstacion: (estacion) =>
        set((s) => {
          const i = s.estaciones.findIndex((e) => e.id === estacion.id)
          if (i < 0) return { estaciones: [...s.estaciones, estacion] }
          const next = s.estaciones.slice()
          next[i] = estacion
          return { estaciones: next }
        }),
      removeEstacion: (id) => set((s) => ({ estaciones: s.estaciones.filter((e) => e.id !== id) })),
      addProceso: (proceso) => set((s) => ({ procesos: [...s.procesos, proceso] })),
      updateProceso: (id, patch) =>
        set((s) => ({
          procesos: s.procesos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
    }),
    {
      name: persistName('charging'),
      version: PERSIST_VERSION,
      partialize: (s) => ({
        procesos: s.procesos,
        centros: s.centros,
        estaciones: s.estaciones,
      }),
    },
  ),
)
