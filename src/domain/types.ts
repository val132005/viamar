export const ROLES = [
  'ADMIN',
  'VENDEDOR_ND',
  'SUPERVISOR_GT',
  'TECNICO',
  'VENTAS_GARANTIAS',
  'DISTRIBUIDOR',
  'CONSULTA',
] as const

export type Role = (typeof ROLES)[number]

export const CAPABILITIES = [
  'ver_dashboard',
  'buscar_serial',
  'ver_ficha',
  'ver_inventario_dealer',
  'sanear_inventario',
  'crear_solicitud_chequeo',
  'registrar_diagnostico',
  'enviar_carga',
  'operar_carga',
  'emitir_certificado',
  'cancelar_certificado',
  'ejecutar_honra',
  'solicitar_honra_dealer',
  'autorizar_honra_dealer',
  'crear_reclamo_fabricante',
  'editar_politicas',
  'editar_maestros',
  'ver_integracion',
  'editar_matriz',
  'reset_demo',
] as const

export type Capability = (typeof CAPABILITIES)[number]

export type Usuario = {
  id: string
  nombre: string
  email: string
  rol: Role
  cargo: string
  iniciales: string
  dealerId?: string
  dealerNombre?: string
}

export type SimulatedToken = {
  typ: 'Bearer'
  iss: string
  aud: string
  sub: string
  name: string
  preferred_username: string
  roles: Role[]
  dealerId?: string
  iat: number
  exp: number
}

export type PermissionMatrix = Record<Role, Record<Capability, boolean>>

export type BadgeTone = {
  bg: string
  border: string
  fg: string
}

export * from './entities'
