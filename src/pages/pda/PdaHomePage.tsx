import { Link } from 'react-router-dom'
import { ClipboardList, ScanLine, Stethoscope } from 'lucide-react'

const ACTIONS = [
  { to: '/pda/conteo', label: 'Conteo de inventario', icon: ScanLine },
  { to: '/pda/diagnostico/CIB-00000000', label: 'Diagnóstico rápido', icon: Stethoscope },
  { to: '/pda/resumen', label: 'Cerrar visita', icon: ClipboardList },
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
              className="flex items-center gap-4 rounded-2xl border border-line bg-white px-4 py-5 shadow-xs transition-[border-color,box-shadow] duration-fast ease-brand hover:border-viamar-200 hover:shadow-sm active:bg-surface-active"
            >
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-viamar-50 text-viamar-600"
                aria-hidden="true"
              >
                <Icon size={24} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1 text-headline-sm font-semibold text-viamar-700">
                {a.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
