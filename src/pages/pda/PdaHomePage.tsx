import { Link } from 'react-router-dom'
import { ClipboardList, ScanLine, Stethoscope } from 'lucide-react'

const ACTIONS = [
  { to: '/pda/conteo', label: 'Conteo de inventario', icon: ScanLine },
  { to: '/pda/diagnostico/CIB-00000000', label: 'Diagnóstico rápido', icon: Stethoscope },
  { to: '/pda/resumen', label: 'Cerrar visita', icon: ClipboardList },
]

export function PdaHomePage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-headline-md text-viamar-800">Visita PDA</h1>
      <p className="text-body-sm text-ink-secondary">Conteo contra esperado, diagnóstico rápido y cierre de visita con chequeo.</p>
      {ACTIONS.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.to}
            to={a.to}
            className="h-14 px-3 rounded border border-app-border-strong bg-white flex items-center gap-3 text-label-lg hover:bg-viamar-50"
          >
            <Icon size={22} className="text-viamar-700" />
            {a.label}
          </Link>
        )
      })}
    </div>
  )
}
