import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClienteFinal, Dealer } from '../domain/entities'
import { persistName, PERSIST_VERSION } from './persist'

type DistributorState = {
  dealers: Dealer[]
  clientes: ClienteFinal[]
  load: (data: Pick<DistributorState, 'dealers' | 'clientes'>) => void
  upsertDealer: (dealer: Dealer) => void
  removeDealer: (id: string) => void
  upsertCliente: (cliente: ClienteFinal) => void
}

export const useDistributorStore = create<DistributorState>()(
  persist(
    (set) => ({
      dealers: [],
      clientes: [],
      load: (data) => set(data),
      upsertDealer: (dealer) =>
        set((s) => {
          const i = s.dealers.findIndex((d) => d.id === dealer.id)
          if (i < 0) return { dealers: [...s.dealers, dealer] }
          const next = s.dealers.slice()
          next[i] = dealer
          return { dealers: next }
        }),
      removeDealer: (id) => set((s) => ({ dealers: s.dealers.filter((d) => d.id !== id) })),
      upsertCliente: (cliente) =>
        set((s) => {
          const i = s.clientes.findIndex((c) => c.id === cliente.id)
          if (i < 0) return { clientes: [...s.clientes, cliente] }
          const next = s.clientes.slice()
          next[i] = cliente
          return { clientes: next }
        }),
    }),
    {
      name: persistName('distributor'),
      version: PERSIST_VERSION,
      partialize: (s) => ({ dealers: s.dealers, clientes: s.clientes }),
    },
  ),
)
