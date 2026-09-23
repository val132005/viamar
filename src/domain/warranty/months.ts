import { monthsElapsed } from '../dates'

export function mesesCalendarioEnteros(desde: Date, hasta: Date): number {
  return monthsElapsed(desde, hasta)
}

export function diasEntre(desde: Date, hasta: Date): number {
  const ms = hasta.getTime() - desde.getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

export function parseIso(value: string): Date {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new Error(`Fecha inválida: ${value}`)
  return d
}
