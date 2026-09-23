import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Formula, PoliticaGarantia, TipoUso } from '../domain/entities'
import type { Capability, Role } from '../domain/types'
import { applyOverrides, DEFAULT_MATRIX } from '../domain/permissions'
import { FORMULA_VARS } from '../domain/warranty/formula'
import { PRESET_FDD489, PRESET_FRD489 } from '../domain/warranty/presets'
import { persistName, PERSIST_VERSION } from './persist'

type Overrides = Partial<Record<Role, Partial<Record<Capability, boolean>>>>

type ConfigState = {
  overrides: Overrides
  politicas: PoliticaGarantia[]
  formulas: Formula[]
  tiposUso: TipoUso[]
  togglePermiso: (role: Role, capability: Capability) => void
  resetMatriz: () => void
  upsertTipoUso: (tipo: TipoUso) => void
  removeTipoUso: (id: string) => void
  loadMaestros: (data: Pick<ConfigState, 'politicas' | 'formulas' | 'tiposUso'>) => void
  guardarVersion: (politicaId: string, expresion: string) => { version: number } | { error: string }
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      overrides: {},
      politicas: [],
      formulas: [],
      tiposUso: [],
      togglePermiso: (role, capability) =>
        set((s) => {
          const current = applyOverrides(DEFAULT_MATRIX, s.overrides)[role][capability]
          return {
            overrides: {
              ...s.overrides,
              [role]: { ...s.overrides[role], [capability]: !current },
            },
          }
        }),
      resetMatriz: () => set({ overrides: {} }),
      upsertTipoUso: (tipo) =>
        set((s) => {
          const i = s.tiposUso.findIndex((t) => t.id === tipo.id)
          if (i < 0) return { tiposUso: [...s.tiposUso, tipo] }
          const next = s.tiposUso.slice()
          next[i] = tipo
          return { tiposUso: next }
        }),
      removeTipoUso: (id) => set((s) => ({ tiposUso: s.tiposUso.filter((t) => t.id !== id) })),
      loadMaestros: (data) => set(data),
      guardarVersion: (politicaId, expresion) => {
        const current = get().politicas
          .filter((p) => p.id === politicaId)
          .slice()
          .sort((a, b) => b.version - a.version)[0]
        if (!current) return { error: 'Política no encontrada' }
        const nextVersion = current.version + 1
        const formulaId = `${politicaId}-f-v${nextVersion}`
        const preset =
          expresion.trim() === PRESET_FDD489
            ? 'FDD489'
            : expresion.trim() === PRESET_FRD489
              ? 'FRD489'
              : 'custom'
        const today = new Date().toISOString().slice(0, 10)
        set((s) => ({
          formulas: [
            ...s.formulas,
            {
              id: formulaId,
              expresion,
              variablesUsadas: [...FORMULA_VARS],
              preset,
            },
          ],
          politicas: [
            ...s.politicas.map((p) =>
              p.id === politicaId && p.estado === 'ACTIVA'
                ? { ...p, estado: 'HISTORICA' as const, vigenciaHasta: today }
                : p,
            ),
            {
              ...current,
              version: nextVersion,
              formulaId,
              vigenciaDesde: today,
              vigenciaHasta: null,
              estado: 'ACTIVA',
            },
          ],
        }))
        return { version: nextVersion }
      },
    }),
    {
      name: persistName('config'),
      version: PERSIST_VERSION,
      partialize: (s) => ({
        overrides: s.overrides,
        politicas: s.politicas,
        formulas: s.formulas,
        tiposUso: s.tiposUso,
      }),
    },
  ),
)
