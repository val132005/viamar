import { Construction } from 'lucide-react'
import { EmptyState } from '../../components/ui/EmptyState'

export function ModulePlaceholder({
  title,
  phase = 'F1',
}: {
  title: string
  phase?: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-headline-lg text-viamar-800">{title}</h1>
      <EmptyState
        icon={Construction}
        title="Módulo listo para datos"
        description={`La navegación y los permisos ya filtran esta pantalla. El seed y las acciones llegan en ${phase}.`}
      />
    </div>
  )
}
