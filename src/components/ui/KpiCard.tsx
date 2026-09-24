import type { LucideIcon } from 'lucide-react'
import { StatCard } from './KpiTile'

/** Envoltura heredada: `StatCard` es el componente canónico de métrica. */
export function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
}) {
  return <StatCard label={label} value={value} hint={hint} icon={icon} />
}
