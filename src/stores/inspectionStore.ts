import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LineaDiagnostico, SolicitudChequeo } from '../domain/entities'
import { persistName, PERSIST_VERSION } from './persist'

type InspectionState = {
  solicitudes: SolicitudChequeo[]
  load: (solicitudes: SolicitudChequeo[]) => void
  addSolicitud: (solicitud: SolicitudChequeo) => void
  patchSolicitud: (id: string, patch: Partial<SolicitudChequeo>) => void
  updateLinea: (solicitudId: string, lineaId: string, patch: Partial<LineaDiagnostico>) => void
}

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set) => ({
      solicitudes: [],
      load: (solicitudes) => set({ solicitudes }),
      addSolicitud: (solicitud) =>
        set((s) => ({ solicitudes: [...s.solicitudes, solicitud] })),
      patchSolicitud: (id, patch) =>
        set((s) => ({
          solicitudes: s.solicitudes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      updateLinea: (solicitudId, lineaId, patch) =>
        set((s) => ({
          solicitudes: s.solicitudes.map((x) =>
            x.id !== solicitudId
              ? x
              : {
                  ...x,
                  lineas: x.lineas.map((l) => (l.id === lineaId ? { ...l, ...patch } : l)),
                },
          ),
        })),
    }),
    {
      name: persistName('inspection'),
      version: PERSIST_VERSION,
      partialize: (s) => ({ solicitudes: s.solicitudes }),
    },
  ),
)
