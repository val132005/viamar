import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, ScanLine, Stethoscope } from 'lucide-react'

const ACTIONS = [
  { to: '/pda/conteo', label: 'Conteo de inventario', hint: 'Escanea contra lo esperado', icon: ScanLine },
  {
    to: '/pda/diagnostico/CIB-00000000',
    label: 'Diagnóstico rápido',
    hint: 'Dictamen de una batería',
    icon: Stethoscope,
  },
  { to: '/pda/resumen', label: 'Cerrar visita', hint: 'Resumen y chequeo', icon: ClipboardList },
]

/**
 * Menú de la visita en terminal de mano.
 *
 * Tres destinos y nada más: en un PDA el dedo es el puntero, así que cada
 * acción es una superficie grande con su icono anclado a la izquierda, no una
 * fila de texto.
 */
export function PdaHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-headline-xl text-ink">Visita PDA</h1>
        <p className="mt-1 text-body-sm text-ink-secondary">
          Conteo contra esperado, diagnóstico rápido y cierre de visita con chequeo.
        </p>
      </header>

      <nav className="flex flex-col gap-3">
        {ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-4 shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-0.5 hover:border-viamar-200 hover:shadow-md active:bg-surface-active"
            >
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-viamar-100/80 text-viamar-600"
                aria-hidden="true"
              >
                <Icon size={23} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-headline-sm text-ink">{a.label}</span>
                <span className="block text-body-xs text-ink-tertiary">{a.hint}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-ink-tertiary" aria-hidden="true" />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
