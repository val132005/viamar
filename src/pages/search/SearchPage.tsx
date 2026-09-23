import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { UBICACION_LABEL } from '../../domain/catalogs'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { searchVisible } from '../../hooks/useVisibleBatteries'
import { useAuthStore } from '../../stores/authStore'
import { useBatteryStore } from '../../stores/batteryStore'

export function SearchPage() {
  const [params] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [q, setQ] = useState(initial)
  const user = useAuthStore((s) => s.usuarioActual)
  const articulos = useBatteryStore((s) => s.articulos)
  const rows = useMemo(() => searchVisible(q, user), [q, user])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-headline-lg text-viamar-800">Trazabilidad</h1>
      <FilterBar value={q} onChange={setQ} placeholder="Serial, documento o nombre…" />
      <DataTable
        columns={[
          {
            key: 'serial',
            header: 'Serial',
            render: (r) => (
              <Link to={`/serial/${r.serial}`} className="font-code-serial text-viamar-700 hover:text-viamar-link-hover">
                {r.serial}
              </Link>
            ),
          },
          {
            key: 'articulo',
            header: 'Artículo',
            render: (r) => articulos.find((a) => a.id === r.articuloId)?.codigo ?? r.articuloId,
          },
          {
            key: 'ubicacion',
            header: 'Ubicación',
            render: (r) => UBICACION_LABEL[r.ubicacionTipo] ?? r.ubicacionTipo,
          },
          {
            key: 'estado',
            header: 'Diagnóstico',
            render: (r) => <StatusBadge catalogId={r.diagnosticoId} />,
          },
        ]}
        rows={rows}
        rowKey={(r) => r.serial}
        emptyTitle="Sin coincidencias"
        emptyDescription={
          q
            ? `No hay resultados para «${q}».`
            : 'Escriba un serial CIB, un documento o un nombre de cliente.'
        }
      />
    </div>
  )
}
