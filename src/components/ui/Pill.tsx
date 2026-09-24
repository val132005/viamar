import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type PillTone = 'ok' | 'danger' | 'warn' | 'info' | 'accent' | 'neutral' | 'brand'
export type PillVariant = 'soft' | 'outline' | 'solid'

/**
 * Etiqueta de estado sobria: el color acompaña al texto, nunca lo sustituye.
 * Sin mayúsculas forzadas — un estado se lee, no se grita.
 */
const SOFT: Record<PillTone, string> = {
  ok: 'bg-success-soft text-success-text ring-success-border',
  danger: 'bg-critical-soft text-critical-text ring-critical-border',
  warn: 'bg-warning-soft text-warning-text ring-warning-border',
  info: 'bg-info-soft text-info-text ring-info-border',
  accent: 'bg-viamar-50 text-viamar-700 ring-viamar-200',
  neutral: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  brand: 'bg-viamar-50 text-viamar-800 ring-viamar-200',
}

const OUTLINE: Record<PillTone, string> = {
  ok: 'bg-white text-success-text ring-success-border',
  danger: 'bg-white text-critical-text ring-critical-border',
  warn: 'bg-white text-warning-text ring-warning-border',
  info: 'bg-white text-info-text ring-info-border',
  accent: 'bg-white text-viamar-700 ring-viamar-200',
  neutral: 'bg-white text-neutral-600 ring-neutral-200',
  brand: 'bg-white text-viamar-800 ring-viamar-200',
}

const SOLID: Record<PillTone, string> = {
  ok: 'bg-success text-white ring-transparent',
  danger: 'bg-critical text-white ring-transparent',
  warn: 'bg-warning text-white ring-transparent',
  info: 'bg-info text-white ring-transparent',
  accent: 'bg-viamar-accent text-white ring-transparent',
  neutral: 'bg-neutral-600 text-white ring-transparent',
  brand: 'bg-viamar-500 text-white ring-transparent',
}

const DOT: Record<PillTone, string> = {
  ok: 'bg-success',
  danger: 'bg-critical',
  warn: 'bg-warning',
  info: 'bg-info',
  accent: 'bg-viamar-accent',
  neutral: 'bg-neutral-400',
  brand: 'bg-viamar-500',
}

export function Pill({
  tone = 'neutral',
  variant = 'soft',
  dot = false,
  icon,
  children,
  className,
}: {
  tone?: PillTone
  variant?: PillVariant
  /** Punto de color: refuerza el estado sin depender solo del fondo. */
  dot?: boolean
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  const styles = variant === 'solid' ? SOLID : variant === 'outline' ? OUTLINE : SOFT
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5',
        'text-label-md ring-1 ring-inset',
        styles[tone],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            variant === 'solid' ? 'bg-white/80' : DOT[tone],
          )}
        />
      ) : null}
      {icon}
      {children}
    </span>
  )
}

/** Punto de estado suelto, para usar dentro de celdas densas. */
export function StatusDot({ tone = 'neutral', className }: { tone?: PillTone; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', DOT[tone], className)} />
  )
}
