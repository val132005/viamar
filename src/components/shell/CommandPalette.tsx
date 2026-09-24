import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BadgeCheck,
  BatteryCharging,
  CornerDownLeft,
  Database,
  Handshake,
  LayoutDashboard,
  Plus,
  Radio,
  ScanLine,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Stethoscope,
  Warehouse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NAV_DEALER, NAV_OPERACIONES, NAV_SISTEMAS, type NavItem } from '../../domain/nav'
import { can } from '../../domain/permissions'
import type { Capability } from '../../domain/types'
import { searchVisible } from '../../hooks/useVisibleBatteries'
import { useMatrix } from '../../hooks/usePermission'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../lib/cn'

const ICONS: Record<NavItem['icon'], LucideIcon> = {
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

type Comando = {
  id: string
  label: string
  /** A qué grupo pertenece dentro de la lista. */
  grupo: 'Ir a' | 'Acciones' | 'Seriales' | 'Recientes'
  hint?: string
  icon: LucideIcon
  to: string
  requiere?: Capability[]
}

const ACCIONES: Comando[] = [
  {
    id: 'acc-solicitud',
    label: 'Nueva solicitud de chequeo',
    grupo: 'Acciones',
    icon: Plus,
    to: '/gestion-tecnica/nueva',
    requiere: ['crear_solicitud_chequeo'],
  },
  {
    id: 'acc-honra',
    label: 'Nueva honra de mostrador',
    grupo: 'Acciones',
    icon: Shield,
    to: '/honras/nueva',
    requiere: ['ejecutar_honra'],
  },
  {
    id: 'acc-buscar',
    label: 'Buscar un serial',
    grupo: 'Acciones',
    icon: ScanLine,
    to: '/buscar',
    requiere: ['buscar_serial'],
  },
]

const RECIENTES_KEY = 'viamar.palette.recientes'

function leerRecientes(): string[] {
  try {
    const raw = window.localStorage.getItem(RECIENTES_KEY)
    return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : []
  } catch {
    return []
  }
}

/**
 * Paleta de comandos global (Ctrl/Cmd + K).
 *
 * Reúne en un solo sitio las tres cosas que un operador busca a diario: ir a
 * un módulo, disparar una acción frecuente y abrir un serial concreto. Los
 * resultados respetan la matriz de permisos y el ámbito del distribuidor: la
 * paleta nunca ofrece un atajo a lo que el usuario no puede ver.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.usuarioActual)
  const matrix = useMatrix()
  const [recientes, setRecientes] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setQ('')
    setCursor(0)
    setRecientes(leerRecientes())
    /* El foco entra al campo: la paleta se usa escribiendo, no apuntando. */
    const t = window.setTimeout(() => inputRef.current?.focus(), 10)
    return () => window.clearTimeout(t)
  }, [open])

  const navegacion = useMemo<Comando[]>(() => {
    const fuente = user?.rol === 'DISTRIBUIDOR' ? NAV_DEALER : [...NAV_OPERACIONES, ...NAV_SISTEMAS]
    return fuente
      .filter((item) => item.anyOf.some((c) => can(matrix, user?.rol, c)))
      .map((item) => ({
        id: `nav-${item.to}`,
        label: item.label,
        grupo: 'Ir a' as const,
        icon: ICONS[item.icon],
        to: item.to,
      }))
  }, [matrix, user?.rol])

  const acciones = useMemo(
    () => ACCIONES.filter((a) => !a.requiere || a.requiere.some((c) => can(matrix, user?.rol, c))),
    [matrix, user?.rol],
  )

  /* Seriales: sólo cuando hay consulta. Listarlos todos en reposo convertiría
     la paleta en un volcado de inventario. */
  const seriales = useMemo<Comando[]>(() => {
    const needle = q.trim()
    if (needle.length < 2) return []
    return searchVisible(needle, user ?? null)
      .slice(0, 6)
      .map((b) => ({
        id: `serial-${b.serial}`,
        label: b.serial,
        grupo: 'Seriales' as const,
        hint: `${b.articuloId} · ${b.ubicacionTipo.toLowerCase().replace('_', ' ')}`,
        icon: ScanLine,
        to: `/serial/${b.serial}`,
      }))
  }, [q, user])

  const recientesComandos = useMemo<Comando[]>(() => {
    if (q.trim()) return []
    return recientes.map((serial) => ({
      id: `rec-${serial}`,
      label: serial,
      grupo: 'Recientes' as const,
      hint: 'Abierto recientemente',
      icon: ScanLine,
      to: `/serial/${serial}`,
    }))
  }, [recientes, q])

  const resultados = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const estaticos = [...navegacion, ...acciones].filter((c) =>
      needle ? c.label.toLowerCase().includes(needle) : true,
    )
    return [...recientesComandos, ...seriales, ...estaticos]
  }, [navegacion, acciones, seriales, recientesComandos, q])

  useEffect(() => {
    setCursor(0)
  }, [q])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => Math.min(resultados.length - 1, c + 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => Math.max(0, c - 1))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const elegido = resultados[cursor]
        if (elegido) ejecutar(elegido)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  /* El elemento activo se mantiene a la vista al recorrer con el teclado. */
  useEffect(() => {
    listRef.current?.querySelector('[data-activo="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  function ejecutar(c: Comando) {
    if (c.grupo === 'Seriales' || c.grupo === 'Recientes') {
      const proximos = [c.label, ...recientes.filter((s) => s !== c.label)].slice(0, 5)
      try {
        window.localStorage.setItem(RECIENTES_KEY, JSON.stringify(proximos))
      } catch {
        /* Sin almacenamiento local la paleta sigue funcionando, sin historial. */
      }
    }
    onClose()
    navigate(c.to)
  }

  if (!open) return null

  let grupoActual = ''

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Cerrar paleta de comandos"
        onClick={onClose}
        className="absolute inset-0 bg-viamar-950/30"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-white shadow-lg animate-fade-in"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search size={17} className="shrink-0 text-ink-tertiary" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar módulos, acciones o seriales…"
            aria-label="Buscar"
            className="h-12 flex-1 bg-transparent text-body-lg text-ink placeholder:text-ink-tertiary focus:outline-none"
          />
          <kbd className="shrink-0 rounded-xs border border-line px-1.5 py-0.5 text-label-sm text-ink-tertiary">
            Esc
          </kbd>
        </div>

        <ul ref={listRef} className="scroll-slim max-h-[52vh] overflow-y-auto py-1.5">
          {resultados.length === 0 ? (
            <li className="px-4 py-8 text-center">
              <p className="text-body-sm text-ink-secondary">
                Nada coincide con «{q.trim()}».
              </p>
              <p className="mt-1 text-body-xs text-ink-tertiary">
                Prueba con un serial completo, un módulo o una acción.
              </p>
            </li>
          ) : (
            resultados.map((c, i) => {
              const nuevoGrupo = c.grupo !== grupoActual
              grupoActual = c.grupo
              const activo = i === cursor
              const Icon = c.icon
              return (
                <li key={c.id}>
                  {nuevoGrupo ? (
                    <p className="px-3.5 pb-1 pt-2 text-overline uppercase text-ink-tertiary">
                      {c.grupo}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    data-activo={activo}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => ejecutar(c)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors duration-instant',
                      activo ? 'bg-surface-selected' : 'hover:bg-surface-hover',
                    )}
                  >
                    <Icon
                      size={15}
                      className={cn('shrink-0', activo ? 'text-viamar-600' : 'text-ink-tertiary')}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-sm text-ink">{c.label}</span>
                      {c.hint ? (
                        <span className="block truncate text-body-xs text-ink-tertiary">
                          {c.hint}
                        </span>
                      ) : null}
                    </span>
                    {activo ? (
                      <CornerDownLeft size={14} className="shrink-0 text-ink-tertiary" />
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <footer className="flex items-center gap-3 border-t border-line bg-surface-subtle px-3.5 py-2 text-body-xs text-ink-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="rounded-xs border border-line bg-white px-1 py-px">↑</kbd>
            <kbd className="rounded-xs border border-line bg-white px-1 py-px">↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded-xs border border-line bg-white px-1 py-px">↵</kbd>
            abrir
          </span>
        </footer>
      </div>
    </div>
  )
}
