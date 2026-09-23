import { useMemo } from 'react'
import { applyOverrides, can, DEFAULT_MATRIX } from '../domain/permissions'
import type { Capability } from '../domain/types'
import { useAuthStore } from '../stores/authStore'
import { useConfigStore } from '../stores/configStore'

export function useMatrix() {
  const overrides = useConfigStore((s) => s.overrides)
  return useMemo(() => applyOverrides(DEFAULT_MATRIX, overrides), [overrides])
}

export function useCan(capability: Capability): boolean {
  const role = useAuthStore((s) => s.usuarioActual?.rol)
  const matrix = useMatrix()
  return can(matrix, role, capability)
}

export function useCanAny(capabilities: Capability[]): boolean {
  const role = useAuthStore((s) => s.usuarioActual?.rol)
  const matrix = useMatrix()
  return capabilities.some((c) => can(matrix, role, c))
}
