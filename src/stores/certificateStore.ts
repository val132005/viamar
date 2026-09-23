import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Certificado } from '../domain/entities'
import { persistName, PERSIST_VERSION } from './persist'

type CertificateState = {
  certificados: Certificado[]
  load: (certificados: Certificado[]) => void
  upsert: (cert: Certificado) => void
  cancelar: (id: string) => void
}

export const useCertificateStore = create<CertificateState>()(
  persist(
    (set) => ({
      certificados: [],
      load: (certificados) => set({ certificados }),
      upsert: (cert) =>
        set((s) => {
          const i = s.certificados.findIndex((c) => c.id === cert.id)
          if (i < 0) return { certificados: [...s.certificados, cert] }
          const next = s.certificados.slice()
          next[i] = cert
          return { certificados: next }
        }),
      cancelar: (id) =>
        set((s) => ({
          certificados: s.certificados.map((c) => (c.id === id ? { ...c, estado: 'C' } : c)),
        })),
    }),
    {
      name: persistName('certificate'),
      version: PERSIST_VERSION,
      partialize: (s) => ({ certificados: s.certificados }),
    },
  ),
)
