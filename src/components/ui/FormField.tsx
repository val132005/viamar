import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Base = {
  label: string
  hint?: string
}

const inputClass =
  'h-10 w-full px-3 rounded-lg border border-app-border-strong bg-white text-body-md transition-shadow focus:shadow-glow'

export function FormField({
  label,
  hint,
  className,
  ...props
}: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-label-md">
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
    <label className="flex flex-col gap-1 text-label-md">
      {label}
      <select className={inputClass} {...props}>
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
    <label className="flex flex-col gap-1 text-label-md">
      {label}
      <textarea
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-app-border-strong bg-white text-body-md min-h-32 transition-shadow focus:shadow-glow',
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-body-sm text-ink-secondary font-normal">{hint}</span> : null}
    </label>
  )
}
