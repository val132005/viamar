import type { Capability, PermissionMatrix, Role } from './types'
import { CAPABILITIES, ROLES } from './types'

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrador',
  VENDEDOR_ND: 'Vendedor de negocios diversos',
  SUPERVISOR_GT: 'Supervisor de gestión técnica',
  TECNICO: 'Técnico de centro',
  VENTAS_GARANTIAS: 'Ventas / Garantías',
  DISTRIBUIDOR: 'Distribuidor',
  CONSULTA: 'Consulta',
}

export const CAPABILITY_LABEL: Record<Capability, string> = {
  ver_dashboard: 'Ver dashboard',
  buscar_serial: 'Buscar serial (global)',
  ver_ficha: 'Ver ficha / timeline',
  ver_inventario_dealer: 'Ver inventario dealer',
  sanear_inventario: 'Sanear inventario',
  crear_solicitud_chequeo: 'Crear solicitud de chequeo',
  registrar_diagnostico: 'Registrar diagnóstico',
  enviar_carga: 'Enviar a carga',
  operar_carga: 'Operar proceso de carga',
  emitir_certificado: 'Emitir certificado',
  cancelar_certificado: 'Cancelar certificado',
  ejecutar_honra: 'Ejecutar honra',
  solicitar_honra_dealer: 'Solicitar honra (dealer)',
  autorizar_honra_dealer: 'Autorizar honra de dealer',
  crear_reclamo_fabricante: 'Crear reclamo a fabricante',
  editar_politicas: 'Editar políticas y fórmulas',
  editar_maestros: 'Editar maestros',
  ver_integracion: 'Ver bandeja de integración',
  editar_matriz: 'Editar matriz de permisos',
  reset_demo: 'Restablecer datos demo',
}

export const DEALER_SCOPED: Capability[] = [
  'buscar_serial',
  'ver_ficha',
  'ver_inventario_dealer',
  'emitir_certificado',
  'cancelar_certificado',
  'solicitar_honra_dealer',
]

/** Interruptor Álvaro/Andree: honra del supervisor apagada por defecto. */
export const TOGGLE_HONRA_SUPERVISOR = {
  role: 'SUPERVISOR_GT' as const,
  capability: 'ejecutar_honra' as const,
}

const ALL_FALSE = Object.fromEntries(CAPABILITIES.map((c) => [c, false])) as Record<
  Capability,
  boolean
>

function grant(caps: Capability[]): Record<Capability, boolean> {
  const row = { ...ALL_FALSE }
  for (const c of caps) row[c] = true
  return row
}

export const DEFAULT_MATRIX: PermissionMatrix = {
  ADMIN: grant([...CAPABILITIES]),
  VENDEDOR_ND: grant([
    'ver_dashboard',
    'buscar_serial',
    'ver_ficha',
    'ver_inventario_dealer',
    'sanear_inventario',
    'crear_solicitud_chequeo',
  ]),
  SUPERVISOR_GT: grant([
    'ver_dashboard',
    'buscar_serial',
    'ver_ficha',
    'ver_inventario_dealer',
    'sanear_inventario',
    'crear_solicitud_chequeo',
    'registrar_diagnostico',
    'enviar_carga',
    'operar_carga',
  ]),
  TECNICO: grant([
    'ver_dashboard',
    'buscar_serial',
    'ver_ficha',
    'registrar_diagnostico',
    'operar_carga',
  ]),
  VENTAS_GARANTIAS: grant([
    'ver_dashboard',
    'buscar_serial',
    'ver_ficha',
    'ver_inventario_dealer',
    'emitir_certificado',
    'cancelar_certificado',
    'ejecutar_honra',
    'autorizar_honra_dealer',
    'crear_reclamo_fabricante',
    'ver_integracion',
  ]),
  DISTRIBUIDOR: grant([
    'ver_dashboard',
    'buscar_serial',
    'ver_ficha',
    'ver_inventario_dealer',
    'emitir_certificado',
    'cancelar_certificado',
    'solicitar_honra_dealer',
  ]),
  CONSULTA: grant([
    'ver_dashboard',
    'buscar_serial',
    'ver_ficha',
    'ver_inventario_dealer',
    'ver_integracion',
  ]),
}

export function applyOverrides(
  base: PermissionMatrix,
  overrides: Partial<Record<Role, Partial<Record<Capability, boolean>>>>,
): PermissionMatrix {
  const next = structuredClone(base)
  for (const role of ROLES) {
    const row = overrides[role]
    if (!row) continue
    for (const cap of CAPABILITIES) {
      if (row[cap] !== undefined) next[role][cap] = row[cap] as boolean
    }
  }
  return next
}

export function can(
  matrix: PermissionMatrix,
  role: Role | undefined,
  capability: Capability,
): boolean {
  if (!role) return false
  return matrix[role][capability]
}
