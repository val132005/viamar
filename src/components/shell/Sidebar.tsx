import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  BatteryCharging,
  Database,
  Handshake,
  LayoutDashboard,
  Radio,
  ScanLine,
  Settings,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Stethoscope,
  Warehouse,
  BadgeCheck,
} from 'lucide-react'
import { NAV_DEALER, NAV_OPERACIONES, NAV_SISTEMAS, type NavItem } from '../../domain/nav'
import { can } from '../../domain/permissions'
import type { Capability, Role } from '../../domain/types'
import { ViamarLogo } from '../brand/ViamarLogo'
import { cn } from '../../lib/cn'

const ICONS: Record<NavItem['icon'], typeof LayoutDashboard> = {
  layout: LayoutDashboard,
  scan: ScanLine,
  warehouse: Warehouse,
  stethoscope: Stethoscope,
  battery: BatteryCharging,
  badge: BadgeCheck,
  shield: Shield,
  handshake: Handshake,
  sliders: SlidersHorizontal,
  database: Database,
  settings: Settings,
  radio: Radio,
  'bar-chart': BarChart3,
  pda: Smartphone,
}

function visibleItems(
  items: NavItem[],
  role: Role,
  matrix: Record<Role, Record<Capability, boolean>>,
) {
  return items.filter((item) => {
    if (item.hideFor?.includes(role)) return false
    return item.anyOf.some((cap) => can(matrix, role, cap))
  })
}

function Section({
  title,
  items,
}: {
  title: string
  items: NavItem[]
}) {
  if (items.length === 0) return null
  return (
    <div className="px-3 py-2">
      <p className="px-2 mb-1 text-label-sm uppercase tracking-wider text-ink-secondary">{title}</p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/' || item.to === '/dealer' || item.to === '/honras'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-2 py-2 rounded text-body-sm',
                    isActive
                      ? 'bg-viamar-50 text-viamar-800 font-semibold'
                      : 'text-ink hover:bg-app-bg',
                  )
                }
              >
                <Icon size={16} strokeWidth={1.8} />
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type Props = {
  role: Role
  matrix: Record<Role, Record<Capability, boolean>>
  variant: 'internal' | 'dealer'
}

export function Sidebar({ role, matrix, variant }: Props) {
  const ops = visibleItems(variant === 'dealer' ? NAV_DEALER : NAV_OPERACIONES, role, matrix)
  const sys = variant === 'dealer' ? [] : visibleItems(NAV_SISTEMAS, role, matrix)
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-app-border flex flex-col">
      <div className="px-3 py-4 border-b border-app-border">
        <ViamarLogo className="h-9 w-auto" />
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        <Section title={variant === 'dealer' ? 'Portal' : 'Operaciones'} items={ops} />
        <Section title="Sistemas" items={sys} />
      </nav>
    </aside>
  )
}
