import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'outlined' | 'danger' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const STYLES: Record<Variant, string> = {
  primary:
    'bg-viamar-500 text-white hover:bg-viamar-600 active:bg-viamar-800 disabled:bg-viamar-200',
  outlined:
    'border border-app-border-strong bg-white hover:bg-app-bg disabled:text-ink-disabled',
  danger: 'bg-danger text-white hover:bg-[#B71C1C]',
  ghost: 'hover:bg-viamar-50 text-viamar-700',
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'h-10 px-4 rounded font-semibold inline-flex items-center justify-center gap-2 text-body-md disabled:cursor-not-allowed',
        STYLES[variant],
        className,
      )}
      {...props}
    />
  )
}
