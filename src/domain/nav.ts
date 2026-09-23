import type { Capability, Role } from './types'

export type NavItem = {
  to: string
  label: string
  icon:
    | 'layout'
    | 'scan'
    | 'warehouse'
    | 'stethoscope'
    | 'battery'
    | 'badge'
    | 'shield'
    | 'handshake'
    | 'sliders'
    | 'database'
    | 'settings'
    | 'radio'
    | 'bar-chart'
    | 'pda'
  anyOf: Capability[]
  hideFor?: Role[]
}

export const NAV_OPERACIONES: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'layout', anyOf: ['ver_dashboard'] },
  { to: '/buscar', label: 'Trazabilidad', icon: 'scan', anyOf: ['buscar_serial', 'ver_ficha'] },
  {
    to: '/distribuidores',
    label: 'Inventario dealers',
    icon: 'warehouse',
    anyOf: ['ver_inventario_dealer'],
  },
  {
    to: '/gestion-tecnica',
    label: 'Gestión técnica',
    icon: 'stethoscope',
    anyOf: ['crear_solicitud_chequeo', 'registrar_diagnostico'],
  },
  {
    to: '/carga',
    label: 'Proceso de carga',
    icon: 'battery',
    anyOf: ['enviar_carga', 'operar_carga'],
  },
  {
    to: '/certificados',
    label: 'Certificados',
    icon: 'badge',
    anyOf: ['emitir_certificado', 'cancelar_certificado'],
  },
  { to: '/honras', label: 'Honra de mostrador', icon: 'shield', anyOf: ['ejecutar_honra'] },
  {
    to: '/honras/dealer',
    label: 'Honra de dealer',
    icon: 'handshake',
    anyOf: ['autorizar_honra_dealer'],
  },
]

export const NAV_SISTEMAS: NavItem[] = [
  {
    to: '/configuracion/politicas',
    label: 'Políticas y fórmulas',
    icon: 'sliders',
    anyOf: ['editar_politicas'],
  },
  { to: '/maestros', label: 'Maestros', icon: 'database', anyOf: ['editar_maestros'] },
  {
    to: '/administracion',
    label: 'Administración',
    icon: 'settings',
    anyOf: ['editar_matriz', 'reset_demo'],
  },
  { to: '/integracion', label: 'Integración F&O', icon: 'radio', anyOf: ['ver_integracion'] },
  { to: '/reportes', label: 'Reportes', icon: 'bar-chart', anyOf: ['ver_dashboard'] },
  {
    to: '/pda',
    label: 'Vista PDA',
    icon: 'pda',
    anyOf: ['crear_solicitud_chequeo', 'registrar_diagnostico'],
  },
]

export const NAV_DEALER: NavItem[] = [
  { to: '/dealer', label: 'Mi inventario', icon: 'warehouse', anyOf: ['ver_inventario_dealer'] },
  { to: '/dealer/vender', label: 'Reportar venta', icon: 'badge', anyOf: ['emitir_certificado'] },
  {
    to: '/dealer/certificados',
    label: 'Mis certificados',
    icon: 'badge',
    anyOf: ['emitir_certificado', 'cancelar_certificado'],
  },
  {
    to: '/dealer/honra',
    label: 'Mis honras',
    icon: 'handshake',
    anyOf: ['solicitar_honra_dealer'],
  },
]
