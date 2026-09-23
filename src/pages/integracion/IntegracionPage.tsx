import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Drawer } from '../../components/ui/Drawer'
import { FilterBar } from '../../components/ui/FilterBar'
import { SelectField } from '../../components/ui/FormField'
import { IntegrationCard } from '../../components/ui/IntegrationCard'
import { INTEGRATION_VERBS } from '../../domain/catalogs'
import { formatDate } from '../../domain/dates'
import { useIntegrationStore } from '../../stores/integrationStore'

function prettyPayload(payload: string): string {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2)
  } catch {
    return payload
  }
}

export function IntegracionPage() {
  const eventos = useIntegrationStore((s) => s.eventos)
  const reintentar = useIntegrationStore((s) => s.reintentar)
  const [q, setQ] = useState('')
  const [verbo, setVerbo] = useState('todos')
  const [estado, setEstado] = useState('todos')
  const [detalleId, setDetalleId] = useState<string | null>(null)

  const conteo = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of eventos) map.set(e.verbo, (map.get(e.verbo) ?? 0) + 1)
    return INTEGRATION_VERBS.map((v) => ({ ...v, total: map.get(v.id) ?? 0 }))
  }, [eventos])

  const rows = useMemo(
    () =>
      eventos
        .filter((e) => (verbo === 'todos' ? true : e.verbo === verbo))
        .filter((e) => (estado === 'todos' ? true : e.estado === estado))
        .filter((e) =>
          q.trim() ? (e.verbo + ' ' + e.payload).toLowerCase().includes(q.trim().toLowerCase()) : true,
        )
        .slice()
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [eventos, verbo, estado, q],
  )
  const detalle = detalleId ? eventos.find((e) => e.id === detalleId) : undefined

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-headline-lg text-viamar-800">Salida hacia D365FO</h1>
        <p className="text-body-sm text-ink-secondary">Cuatro verbos. Una honra encola los cuatro.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {conteo.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVerbo((prev) => (prev === v.id ? 'todos' : v.id))}
            className={`px-3 py-1.5 rounded border text-label-md ${verbo === v.id ? 'border-viamar-500 bg-viamar-50 text-viamar-800' : 'border-app-border-strong bg-white'}`}
          >
            <span className="font-code-serial">{v.id}</span>{' '}
            <span className="text-ink-secondary">· {v.total}</span>
          </button>
        ))}
      </div>
      <FilterBar value={q} onChange={setQ} placeholder="Buscar por verbo o payload…">
        <SelectField label="Verbo" value={verbo} onChange={(e) => setVerbo(e.target.value)}>
          <option value="todos">Todos</option>
          {INTEGRATION_VERBS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="enviado">Enviado</option>
          <option value="error">Error (reintentable)</option>
        </SelectField>
      </FilterBar>
      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((s) => (
          <div key={s.id} className="flex flex-col gap-2">
            <IntegrationCard
              verb={s.verbo}
              payload={s.payload}
              estado={s.estado}
              origenId={s.origenRegistro}
              onRetry={() => reintentar(s.id)}
            />
            <Button
              variant="outlined"
              className="self-start h-8 text-label-md"
              onClick={() => setDetalleId(s.id)}
            >
              Ver payload
            </Button>
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-body-sm text-ink-secondary">Sin eventos para este filtro.</p>
      ) : null}
      <Drawer open={detalle !== undefined} title={detalle ? detalle.verbo : ''} onClose={() => setDetalleId(null)}>
        {detalle ? (
          <div className="flex flex-col gap-3">
            <p className="text-body-sm text-ink-secondary">
              {formatDate(detalle.fecha)} · estado {detalle.estado} · intentos {detalle.intentos} ·
              módulo {detalle.origenModulo} · origen {detalle.origenRegistro}
            </p>
            <pre className="text-[12px] bg-app-bg border border-app-border rounded p-3 overflow-auto whitespace-pre-wrap">
              {prettyPayload(detalle.payload)}
            </pre>
            {detalle.estado === 'error' ? (
              <Button
                variant="outlined"
                className="self-start h-8 text-label-md"
                onClick={() => reintentar(detalle.id)}
              >
                Reintentar
              </Button>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
