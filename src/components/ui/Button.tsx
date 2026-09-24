import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

/**
 * Jerarquía de acción, de mayor a menor peso:
 *   primary   — la acción principal de la pantalla. Una sola por vista.
 *   secondary — alternativas de igual importancia, contorneadas.
 *   tertiary  — acciones ligeras; sin contorno hasta el hover.
 *   danger    — destructivas. Nunca deben competir con la primaria.
 *
 * `outlined` y `ghost` se mantienen como alias de los nombres anteriores.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'danger-quiet'
  | 'outlined'
  | 'ghost'

export type ButtonSize = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconOnly?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-viamar-500 text-white border border-viamar-500',
    'hover:bg-viamar-600 hover:border-viamar-600',
    'active:bg-viamar-700 active:border-viamar-700',
    'focus-visible:shadow-focus',
    'disabled:bg-viamar-200 disabled:border-viamar-200 disabled:text-white',
  ),
  secondary: cn(
    'bg-white text-ink border border-line-strong',
    'hover:bg-surface-hover hover:border-line-brand',
    'active:bg-surface-active',
    'focus-visible:shadow-focus',
    'disabled:text-ink-disabled disabled:bg-white disabled:border-line',
  ),
  tertiary: cn(
    'bg-transparent text-ink-secondary border border-transparent',
    'hover:bg-surface-hover hover:text-ink',
    'active:bg-surface-active',
    'focus-visible:shadow-focus',
    'disabled:text-ink-disabled disabled:bg-transparent',
  ),
  danger: cn(
    'bg-critical text-white border border-critical',
    'hover:bg-critical-text hover:border-critical-text',
    'focus-visible:shadow-focus-danger',
    'disabled:bg-critical-border disabled:border-critical-border',
  ),
  'danger-quiet': cn(
    'bg-transparent text-critical border border-transparent',
    'hover:bg-critical-soft hover:border-critical-border',
    'focus-visible:shadow-focus-danger',
    'disabled:text-ink-disabled',
  ),
  /* Alias heredados. */
  outlined: cn(
    'bg-white text-ink border border-line-strong',
    'hover:bg-surface-hover hover:border-line-brand',
    'active:bg-surface-active',
    'focus-visible:shadow-focus',
    'disabled:text-ink-disabled',
  ),
  ghost: cn(
    'bg-transparent text-ink-secondary border border-transparent',
    'hover:bg-surface-hover hover:text-ink',
    'focus-visible:shadow-focus',
    'disabled:text-ink-disabled',
  ),
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-control-sm px-2.5 text-label-md gap-1.5 rounded-sm',
  md: 'h-control px-3 text-label-lg gap-2 rounded',
  lg: 'h-control-lg px-4 text-body-md font-semibold gap-2 rounded',
}

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-control-sm w-control-sm rounded-sm',
  md: 'h-control w-control rounded',
  lg: 'h-control-lg w-control-lg rounded',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly = false,
  leadingIcon,
  trailingIcon,
  className,
  type = 'button',
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold',
        'transition-colors duration-fast ease-brand',
        'disabled:cursor-not-allowed',
        iconOnly ? ICON_SIZES[size] : SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2
          size={size === 'sm' ? 13 : 15}
          className="animate-spin"
          aria-hidden="true"
        />
      ) : (
        leadingIcon
      )}
      {!iconOnly && children}
      {!loading && trailingIcon}
    </button>
  )
}
