import { cn } from '../../lib/cn'

type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  hint?: string
}

export function PermissionToggle({ checked, onChange, label, disabled, hint }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      title={hint}
      className={cn(
        'relative h-6 w-10 rounded-full transition-colors disabled:opacity-40',
        checked ? 'bg-viamar-500' : 'bg-app-border-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-panel transition-transform',
          'left-0.5',
          checked && 'translate-x-4',
        )}
      />
    </button>
  )
}
