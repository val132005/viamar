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

/*
 * Tonos alineados con los roles semánticos del sistema de diseño
 * (ver `src/styles/tokens.css`). La escala de gravedad del diagnóstico se lee
 * de arriba abajo: correcto → atención → riesgo → fallo.
 */
export const DIAGNOSTICO_CATALOG: CatalogItem[] = [
  {
    id: 'BUEN_ESTADO',
    label: 'Buen estado',
    tone: { bg: '#E8F5EC', border: '#B6DFC2', fg: '#14602A' },
    icon: 'check',
  },
  {
    id: 'DESCARGADA',
    label: 'Descargada',
    tone: { bg: '#EEF2F7', border: '#C9D3E0', fg: '#33455E' },
    icon: 'charge',
  },
  {
    id: 'PARA_GARANTIA',
    label: 'Para garantía',
    tone: { bg: '#FCEEF2', border: '#F2C6D2', fg: '#9D1C44' },
    icon: 'shield',
  },
  {
    id: 'DANADA',
    label: 'Dañada',
    tone: { bg: '#FDECEB', border: '#F3BFBA', fg: '#9B2C24' },
    icon: 'damage',
  },
  {
    id: 'PENDIENTE',
    label: 'Pendiente',
    tone: { bg: '#F1F4F8', border: '#E3E8EF', fg: '#3A4855' },
    icon: 'pending',
  },
]

export const CERTIFICADO_CATALOG: CatalogItem[] = [
  {
    id: 'E',
    label: 'CERT-E',
    tone: { bg: '#E8F5EC', border: '#B6DFC2', fg: '#14602A' },
    icon: 'cert-e',
  },
  {
    id: 'C',
    /* Vigente en verde y cancelado en rojo: los mismos tonos que la dona de
       certificados, para que etiqueta y gráfico se lean igual. */
    label: 'CERT-C · Cancelado',
    tone: { bg: '#FDECEB', border: '#F3BFBA', fg: '#9B2C24' },
    icon: 'cert-c',
  },
]

export const ORIGEN_CATALOG: CatalogItem[] = [
  {
    id: 'D365',
    label: 'Dynamics 365',
    tone: { bg: '#E6F2FB', border: '#B3D8F0', fg: '#0A5E92' },
    icon: 'dynamics',
  },
  {
    id: 'PORTAL',
    label: 'Portal Viamar',
    tone: { bg: '#E8F5EC', border: '#B6DFC2', fg: '#14602A' },
    icon: 'portal',
  },
  {
    id: 'SMART',
    label: 'SMART Legacy',
    tone: { bg: '#EEF2F7', border: '#C9D3E0', fg: '#33455E' },
    icon: 'smart',
  },
  {
    id: 'MANUAL',
    label: 'Manual',
    tone: { bg: '#F1F4F8', border: '#E3E8EF', fg: '#3A4855' },
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
