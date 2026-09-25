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
        'relative h-[22px] w-[38px] rounded-full transition-colors duration-fast disabled:opacity-40',
        checked ? 'bg-gradient-to-b from-[#0a6fe8] to-[#0463dc] shadow-[0_1px_4px_rgba(4,100,220,0.3)]' : 'bg-neutral-300',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-fast',
          'left-0.5',
          checked && 'translate-x-4',
        )}
      />
    </button>
  )
}
