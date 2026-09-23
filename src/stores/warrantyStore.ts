import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Honra, ReclamoFabricante } from '../domain/entities'
import { persistName, PERSIST_VERSION } from './persist'

type WarrantyState = {
  honras: Honra[]
  reclamosFabricante: ReclamoFabricante[]
  load: (data: Pick<WarrantyState, 'honras' | 'reclamosFabricante'>) => void
  upsertHonra: (honra: Honra) => void
  upsertReclamo: (reclamo: ReclamoFabricante) => void
}

export const useWarrantyStore = create<WarrantyState>()(
  persist(
    (set) => ({
      honras: [],
      reclamosFabricante: [],
      load: (data) => set(data),
      upsertHonra: (honra) =>
        set((s) => {
          const i = s.honras.findIndex((h) => h.id === honra.id)
          if (i < 0) return { honras: [...s.honras, honra] }
          const next = s.honras.slice()
          next[i] = honra
          return { honras: next }
        }),
      upsertReclamo: (reclamo) =>
        set((s) => ({ reclamosFabricante: [...s.reclamosFabricante.filter((r) => r.id !== reclamo.id), reclamo] })),
    }),
    {
      name: persistName('warranty'),
      version: PERSIST_VERSION,
      partialize: (s) => ({ honras: s.honras, reclamosFabricante: s.reclamosFabricante }),
    },
  ),
)
