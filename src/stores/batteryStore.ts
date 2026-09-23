import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Articulo, Bateria, Marca } from '../domain/entities'
import { persistName, PERSIST_VERSION } from './persist'

type BatteryState = {
  baterias: Record<string, Bateria>
  articulos: Articulo[]
  marcas: Marca[]
  load: (data: Pick<BatteryState, 'baterias' | 'articulos' | 'marcas'>) => void
  patchBattery: (serial: string, patch: Partial<Bateria>) => void
  upsertBattery: (bateria: Bateria) => void
  upsertArticulo: (articulo: Articulo) => void
  removeArticulo: (id: string) => void
  upsertMarca: (marca: Marca) => void
  removeMarca: (id: string) => void
}

export const useBatteryStore = create<BatteryState>()(
  persist(
    (set) => ({
      baterias: {},
      articulos: [],
      marcas: [],
      load: (data) => set(data),
      patchBattery: (serial, patch) =>
        set((s) => {
          const current = s.baterias[serial]
          if (!current) return s
          return { baterias: { ...s.baterias, [serial]: { ...current, ...patch } } }
        }),
      upsertBattery: (bateria) =>
        set((s) => ({ baterias: { ...s.baterias, [bateria.serial]: bateria } })),
      upsertArticulo: (articulo) =>
        set((s) => {
          const i = s.articulos.findIndex((a) => a.id === articulo.id)
          if (i < 0) return { articulos: [...s.articulos, articulo] }
          const next = s.articulos.slice()
          next[i] = articulo
          return { articulos: next }
        }),
      removeArticulo: (id) => set((s) => ({ articulos: s.articulos.filter((a) => a.id !== id) })),
      upsertMarca: (marca) =>
        set((s) => {
          const i = s.marcas.findIndex((m) => m.id === marca.id)
          if (i < 0) return { marcas: [...s.marcas, marca] }
          const next = s.marcas.slice()
          next[i] = marca
          return { marcas: next }
        }),
      removeMarca: (id) => set((s) => ({ marcas: s.marcas.filter((m) => m.id !== id) })),
    }),
    {
      name: persistName('battery'),
      version: PERSIST_VERSION,
      partialize: (s) => ({ baterias: s.baterias, articulos: s.articulos, marcas: s.marcas }),
    },
  ),
)
