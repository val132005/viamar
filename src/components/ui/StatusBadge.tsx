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
  className?: string
}

export function StatusBadge({ catalogId, item, className }: Props) {
  const resolved = item ?? (catalogId ? catalogById(catalogId) : undefined)
  if (!resolved) return null
  const Icon = ICONS[resolved.icon]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-label-sm uppercase',
        className,
      )}
      style={{
        background: resolved.tone.bg,
        borderColor: resolved.tone.border,
        color: resolved.tone.fg,
      }}
    >
      <Icon size={14} strokeWidth={2.2} />
      {resolved.label}
    </span>
  )
}
