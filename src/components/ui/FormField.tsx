import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Base = {
  label: string
  hint?: string
}

/* Controles con la piel del panel: filo frío, esquinas de 6 px y foco azul. */
const inputClass =
  'h-9 w-full rounded-[6px] border border-[#d9e2ec] bg-white px-3 text-body-sm font-normal text-ink transition-[border-color,box-shadow] duration-fast placeholder:text-[#8591a3] hover:border-viamar-300 focus:border-viamar-400 focus:shadow-focus focus:outline-none disabled:bg-surface-subtle disabled:text-ink-tertiary'

const labelClass = 'flex flex-col gap-1.5 text-label-md text-ink-secondary'

export function FormField({
  label,
  hint,
  className,
  ...props
}: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={labelClass}>
      {label}
      <input className={cn(inputClass, className)} {...props} />
      {hint ? <span className="text-body-sm text-ink-secondary font-normal">{hint}</span> : null}
    </label>
  )
}

export function SelectField({
  label,
  hint,
  children,
  ...props
}: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={labelClass}>
      {label}
      <select className={cn(inputClass, 'cursor-pointer')} {...props}>
        {children}
      </select>
      {hint ? <span className="text-body-sm text-ink-secondary font-normal">{hint}</span> : null}
    </label>
  )
}

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        className={cn(
          inputClass,
          'h-auto min-h-32 py-2',
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-body-sm text-ink-secondary font-normal">{hint}</span> : null}
    </label>
  )
}
