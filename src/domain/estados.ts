import type { PillTone } from '../components/ui/Pill'

/**
 * Traducción de estados del dominio a texto y tono de presentación.
 *
 * Vive fuera del componente `Pill` a propósito: son funciones puras que varias
 * pantallas necesitan sin renderizar una etiqueta, y mantenerlas junto a un
 * componente rompía la recarga en caliente del módulo.
 */

/**
 * Convierte un valor de enum (`EN_PROCESO`) en texto legible (`En proceso`).
 * Ningún identificador técnico debe llegar crudo a la interfaz.
 */
export function humanizeEstado(value: string): string {
  const clean = value.replace(/_/g, ' ').toLowerCase()
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

/** Tono semántico para los estados de proceso comunes a varias pantallas. */
export function estadoTone(estado: string): PillTone {
  switch (estado) {
    case 'FINALIZADA':
    case 'COMPLETADA':
    case 'APROBADA':
    case 'EJECUTADA':
    case 'ACTIVO':
    case 'ACTIVA':
    case 'CARGA_COMPLETADA':
    case 'ENVIADO':
    case 'CONFIRMADO':
      return 'ok'
    case 'EN_PROCESO':
    case 'PROCESANDO':
    case 'EN_CARGA':
      return 'info'
    case 'PENDIENTE':
    case 'SOLICITADA':
      return 'warn'
    case 'CANCELADA':
    case 'RECHAZADA':
    case 'ERROR':
    case 'BLOQUEADA':
    case 'NO_RECUPERABLE':
    case 'FALLIDO':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function honraEstadoTone(estado: string): PillTone {
  if (estado === 'EJECUTADA' || estado === 'APROBADA') return 'ok'
  if (estado === 'RECHAZADA') return 'danger'
  if (estado === 'SOLICITADA' || estado === 'PENDIENTE') return 'warn'
  return 'info'
}

export function honraEstadoLabel(estado: string, origen?: string): string {
  if (origen === 'dealer' && estado === 'SOLICITADA') return 'Pendiente'
  if (estado === 'APROBADA') return 'Autorizada'
  if (estado === 'EJECUTADA') return 'Ejecutada'
  if (estado === 'RECHAZADA') return 'Rechazada'
  if (estado === 'SOLICITADA') return 'Solicitada'
  return humanizeEstado(estado)
}

export function vigenciaTone(v: string): PillTone {
  if (v === 'HEREDA') return 'brand'
  if (v === 'RESETEA') return 'accent'
  return 'neutral'
}

export function vigenciaLabel(v: string): string {
  if (v === 'HEREDA') return 'Hereda'
  if (v === 'RESETEA') return 'Resetea'
  if (v === 'NO_APLICA') return 'No aplica'
  return humanizeEstado(v)
}
