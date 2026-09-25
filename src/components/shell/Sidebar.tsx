import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  BatteryCharging,
  Database,
  Handshake,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
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
import type { Capability, Role, Usuario } from '../../domain/types'
import { ViamarLogo } from '../brand/ViamarLogo'
import { useInspectionStore } from '../../stores/inspectionStore'
import { useWarrantyStore } from '../../stores/warrantyStore'
import { cn } from '../../lib/cn'
import { UserMenu } from './UserMenu'

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

const COLLAPSE_KEY = 'viamar.sidebar.collapsed'

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
  badges,
  collapsed,
}: {
  title: string
  items: NavItem[]
  badges: Record<string, number>
  collapsed: boolean
}) {
  if (items.length === 0) return null
  return (
    <div className="px-3 pb-1 pt-3">
      {!collapsed ? (
        <p className="mb-1.5 px-2 text-overline uppercase text-white/30">{title}</p>
      ) : (
        <div className="mx-1 mb-2 h-px bg-white/10" aria-hidden="true" />
      )}
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon]
          const badge = badges[item.to]
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/' || item.to === '/dealer' || item.to === '/honras'}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex h-9 items-center gap-2.5 rounded-lg text-body-sm',
                    'transition-colors duration-fast ease-brand',
                    collapsed ? 'justify-center px-0' : 'px-2.5',
                    isActive
                      ? 'bg-gradient-to-r from-[#3b5d7d] to-[#34557a] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                      : 'text-white/80 hover:bg-white/[0.07] hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Marca de posición: el acento de marca señala dónde está el usuario. */}
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-[3px] left-0 top-[3px] w-[3px] rounded-full bg-[#3a86d6]"
                      />
                    ) : null}
                    <Icon
                      size={17}
                      strokeWidth={1.8}
                      className={cn('shrink-0', isActive ? 'text-white' : 'text-white/70')}
                    />
                    {!collapsed ? (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {badge ? (
                          <span
                            className={cn(
                              'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-label-sm tabular-nums',
                              isActive ? 'bg-white/20 text-white' : 'bg-viamar-accent text-white',
                            )}
                          >
                            {badge}
                          </span>
                        ) : null}
                      </>
                    ) : badge ? (
                      <span
                        aria-hidden="true"
                        className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-viamar-accent"
                      />
                    ) : null}
                  </>
                )}
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
  /** Usuario de la sesión: su identidad y su menú de cuenta van al pie. */
  user?: Usuario
}

export function Sidebar({ role, matrix, variant, user }: Props) {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(COLLAPSE_KEY) === '1',
  )
  /* Por debajo del umbral la navegación se reduce a iconos sin preguntar: en
     una pantalla estrecha, 236 px de menú son más de un tercio del ancho útil.
     La preferencia manual solo manda cuando hay sitio para respetarla. */
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const isCollapsed = collapsed || narrow

  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const honras = useWarrantyStore((s) => s.honras)
  const ops = visibleItems(variant === 'dealer' ? NAV_DEALER : NAV_OPERACIONES, role, matrix)
  const sys = variant === 'dealer' ? [] : visibleItems(NAV_SISTEMAS, role, matrix)

  const badges: Record<string, number> = {
    '/gestion-tecnica': solicitudes.filter(
      (s) => s.estado === 'PENDIENTE' || s.estado === 'EN_PROCESO',
    ).length,
    '/honras/dealer': honras.filter((h) => h.origen === 'dealer' && h.estado === 'SOLICITADA')
      .length,
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen shrink-0 flex-col text-white',
        /* Azul marino de la maqueta aprobada, con un degradado apenas
           perceptible: la columna tiene fondo, no decoración. */
        'bg-gradient-to-b from-[#0b2b4c] via-[#0a2843] to-[#0a2846]',
        'transition-[width] duration-200 ease-brand',
        isCollapsed ? 'w-[64px]' : 'w-sidebar',
      )}
    >
      {/* Identidad sin placa: versión en negativo del logo oficial. Las letras
          pasan a blanco —el azul corporativo se pierde sobre el marino— y la
          esfera conserva su degradado; una sombra corta le da relieve. */}
      <div
        className={cn(
          'flex shrink-0 items-center px-5 pb-2 pt-5',
          isCollapsed && 'justify-center px-2',
        )}
      >
        <ViamarLogo
          className={cn(
            'logo-negativo w-auto',
            isCollapsed ? 'h-4' : 'h-9',
          )}
        />
      </div>

      <nav className="scroll-slim flex-1 overflow-y-auto pb-2">
        <Section
          title={variant === 'dealer' ? 'Portal' : 'Operaciones'}
          items={ops}
          badges={badges}
          collapsed={isCollapsed}
        />
        <Section title="Sistemas" items={sys} badges={badges} collapsed={isCollapsed} />
      </nav>

      <footer className="shrink-0 border-t border-white/10 p-3">
        {/* Sin sitio para expandir, el control sobra: alternarlo no cambiaría nada. */}
        <button
          type="button"
          hidden={narrow}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={isCollapsed ? 'Expandir navegación' : 'Contraer navegación'}
          className={cn(
            'flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-body-sm text-white/55',
            'transition-colors duration-fast hover:bg-white/[0.07] hover:text-white/85',
            isCollapsed && 'justify-center px-0',
          )}
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          {!isCollapsed ? <span>Contraer</span> : null}
        </button>
        {!isCollapsed ? (
          <p className="mt-1.5 px-2.5 text-label-sm text-white/25">Prototipo · v0.5</p>
        ) : null}

        {/* La cuenta cierra la columna: abajo a la izquierda, donde se busca. */}
        {user ? (
          <div className="mt-2.5 border-t border-white/10 pt-2.5">
            <UserMenu user={user} placement="sidebar" collapsed={isCollapsed} />
          </div>
        ) : null}
      </footer>
    </aside>
  )
}
