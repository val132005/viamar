import type { BadgeTone } from './types'

export type CatalogItem = {
  id: string
  label: string
  tone: BadgeTone
  icon:
    | 'check'
    | 'charge'
    | 'shield'
    | 'damage'
    | 'pending'
    | 'cert-e'
    | 'cert-c'
    | 'dynamics'
    | 'portal'
    | 'smart'
    | 'manual'
}

export const DIAGNOSTICO_CATALOG: CatalogItem[] = [
  {
    id: 'BUEN_ESTADO',
    label: 'Buen estado',
    tone: { bg: '#E8F5E9', border: '#A5D6A7', fg: '#1B5E20' },
    icon: 'check',
  },
  {
    id: 'DESCARGADA',
    label: 'Descargada',
    tone: { bg: '#FFF8E1', border: '#FFE082', fg: '#8A5A00' },
    icon: 'charge',
  },
  {
    id: 'PARA_GARANTIA',
    label: 'Para garantía',
    tone: { bg: '#FFF3E0', border: '#FFCC80', fg: '#B03A00' },
    icon: 'shield',
  },
  {
    id: 'DANADA',
    label: 'Dañada',
    tone: { bg: '#FFEBEE', border: '#EF9A9A', fg: '#B71C1C' },
    icon: 'damage',
  },
  {
    id: 'PENDIENTE',
    label: 'Pendiente',
    tone: { bg: '#ECEFF1', border: '#B0BEC5', fg: '#37474F' },
    icon: 'pending',
  },
]

export const CERTIFICADO_CATALOG: CatalogItem[] = [
  {
    id: 'E',
    label: 'CERT-E',
    tone: { bg: '#E3F2FD', border: '#90CAF9', fg: '#0D47A1' },
    icon: 'cert-e',
  },
  {
    id: 'C',
    label: 'CERT-C · Cancelado',
    tone: { bg: '#EDE7F6', border: '#B39DDB', fg: '#4A148C' },
    icon: 'cert-c',
  },
]

export const ORIGEN_CATALOG: CatalogItem[] = [
  {
    id: 'D365',
    label: 'Dynamics 365',
    tone: { bg: '#E3F2FD', border: '#90CAF9', fg: '#0D47A1' },
    icon: 'dynamics',
  },
  {
    id: 'PORTAL',
    label: 'Portal Viamar',
    tone: { bg: '#E8F5E9', border: '#A5D6A7', fg: '#1B5E20' },
    icon: 'portal',
  },
  {
    id: 'SMART',
    label: 'SMART Legacy',
    tone: { bg: '#FFF8E1', border: '#FFE082', fg: '#8A5A00' },
    icon: 'smart',
  },
  {
    id: 'MANUAL',
    label: 'Manual',
    tone: { bg: '#ECEFF1', border: '#B0BEC5', fg: '#37474F' },
    icon: 'manual',
  },
]

export const UBICACION_LABEL: Record<string, string> = {
  VIAMAR: 'Inventario Viamar',
  DEALER: 'Inventario dealer',
  CENTRO_CARGA: 'Centro de carga',
  CLIENTE: 'Vendida a cliente',
  RETIRADA: 'Retirada / honrada',
}

export const EVENT_LABEL: Record<string, string> = {
  INGRESO: 'Ingreso a inventario Viamar',
  VENTA_DEALER: 'Venta a distribuidor',
  CHEQUEO: 'Chequeo técnico',
  ENVIO_CARGA: 'Envío a centro de carga',
  CARGA_COMPLETADA: 'Carga completada',
  VENTA_CLIENTE: 'Venta a cliente final',
  CERTIFICADO: 'Emisión de certificado',
  SOLICITUD_GARANTIA: 'Solicitud de garantía',
  DIAGNOSTICO: 'Diagnóstico',
  HONRA: 'Honra de garantía',
  REEMPLAZO: 'Reemplazo de serial',
}

export const INTEGRATION_VERBS = [
  { id: 'RMA.CREAR', label: 'RMA.CREAR' },
  { id: 'NOTA_CREDITO.EMITIR', label: 'NOTA_CREDITO.EMITIR' },
  { id: 'MOVIMIENTO_INVENTARIO.REGISTRAR', label: 'MOVIMIENTO_INVENTARIO.REGISTRAR' },
  { id: 'RECLAMO_FABRICANTE.CREAR', label: 'RECLAMO_FABRICANTE.CREAR' },
] as const

const ALL = [...DIAGNOSTICO_CATALOG, ...CERTIFICADO_CATALOG, ...ORIGEN_CATALOG]

export function catalogById(id: string): CatalogItem | undefined {
  return ALL.find((item) => item.id === id)
}
