import {
  BatteryCharging,
  CircleAlert,
  CircleCheck,
  Clock,
  Database,
  Globe,
  OctagonX,
  PencilLine,
  Server,
  ShieldAlert,
} from 'lucide-react'
import { catalogById, type CatalogItem } from '../../domain/catalogs'
import { cn } from '../../lib/cn'

const ICONS: Record<CatalogItem['icon'], typeof CircleCheck> = {
  check: CircleCheck,
  charge: BatteryCharging,
  shield: ShieldAlert,
  damage: OctagonX,
  pending: Clock,
  'cert-e': CircleCheck,
  'cert-c': CircleAlert,
  dynamics: Server,
  portal: Globe,
  smart: Database,
  manual: PencilLine,
}

type Props = {
  catalogId?: string
  item?: CatalogItem
  /** `quiet` reduce la etiqueta a punto + texto: para columnas muy repetidas. */
  variant?: 'soft' | 'quiet'
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Estado de catálogo. El icono y el texto cargan el significado; el color solo
 * lo refuerza, de modo que sigue siendo legible sin distinguir tonos.
 */
export function StatusBadge({ catalogId, item, variant = 'soft', size = 'sm', className }: Props) {
  const resolved = item ?? (catalogId ? catalogById(catalogId) : undefined)
  if (!resolved) return null
  const Icon = ICONS[resolved.icon]

  if (variant === 'quiet') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-body-sm text-ink', className)}>
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: resolved.tone.fg }}
        />
        {resolved.label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm ring-1 ring-inset',
        size === 'sm' ? 'px-1.5 py-0.5 text-label-md' : 'px-2 py-1 text-label-lg',
        className,
      )}
      style={{
        background: resolved.tone.bg,
        // `ring` en vez de `border` para que la etiqueta no altere su alto.
        boxShadow: `inset 0 0 0 1px ${resolved.tone.border}`,
        color: resolved.tone.fg,
      }}
    >
      <Icon size={size === 'sm' ? 12 : 14} strokeWidth={2.2} aria-hidden="true" />
      {resolved.label}
    </span>
  )
}
