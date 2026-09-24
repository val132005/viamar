import { useMemo, useState } from 'react'
import { CircleAlert, Clock, RefreshCw, Radio, Send } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { DetailDrawer, DrawerFacts, DrawerSection } from '../../components/ui/DetailDrawer'
import { MetricCard } from '../../components/ui/MetricCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { Pill, type PillTone } from '../../components/ui/Pill'
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

const ESTADO_TONE: Record<string, PillTone> = {
  pendiente: 'warn',
  enviado: 'ok',
  error: 'danger',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  enviado: 'Enviado',
  error: 'Error',
}

export function IntegracionPage() {
  const eventos = useIntegrationStore((s) => s.eventos)
  const reintentar = useIntegrationStore((s) => s.reintentar)
  const [q, setQ] = useState('')
  const [verbo, setVerbo] = useState('todos')
  const [detalleId, setDetalleId] = useState<string | null>(null)

  /* Un contador por verbo: la cola de salida se lee por tipo de mensaje, que
     es lo que falla o se acumula, no por registro individual. */
  const conteo = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of eventos) map.set(e.verbo, (map.get(e.verbo) ?? 0) + 1)
    return INTEGRATION_VERBS.map((v) => ({ ...v, total: map.get(v.id) ?? 0 }))
  }, [eventos])

  const porEstado = useMemo(
    () => ({
      pendiente: eventos.filter((e) => e.estado === 'pendiente').length,
      enviado: eventos.filter((e) => e.estado === 'enviado').length,
      error: eventos.filter((e) => e.estado === 'error').length,
    }),
    [eventos],
  )

  const rows = useMemo(
    () =>
      eventos
        .filter((e) => (verbo === 'todos' ? true : e.verbo === verbo))
        .filter((e) =>
          q.trim()
            ? (e.verbo + ' ' + e.payload).toLowerCase().includes(q.trim().toLowerCase())
            : true,
        )
        .slice()
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [eventos, verbo, q],
  )

  const detalle = detalleId ? eventos.find((e) => e.id === detalleId) : undefined

  return (
    <div className="page-fill">
      <PageHeader
        title="Salida hacia D365FO"
        description="Cola de mensajes que el prototipo entregaría a Finance & Operations. Cuatro verbos: una honra encola los cuatro."
        tabs={
          <PageTabs
            active={verbo}
            onChange={setVerbo}
            tabs={[
              { id: 'todos', label: 'Todos', count: eventos.length },
              ...conteo.map((v) => ({ id: v.id, label: v.label, count: v.total })),
            ]}
          />
        }
      />

      <MetricGrid columns={4}>
        <MetricCard
          label="Eventos en la cola"
          value={eventos.length}
          icon={Radio}
          tone="brand"
          context={`${INTEGRATION_VERBS.length} verbos distintos`}
        />
        <MetricCard
          label="Pendientes de envío"
          value={porEstado.pendiente}
          icon={Clock}
          tone="warn"
          filled={porEstado.pendiente > 0}
          context="Esperan ventana de integración"
        />
        <MetricCard
          label="Enviados"
          value={porEstado.enviado}
          icon={Send}
          tone="ok"
          filled={porEstado.enviado > 0}
          context={
            eventos.length
              ? `${Math.round((porEstado.enviado / eventos.length) * 100)}% de la cola`
              : undefined
          }
        />
        <MetricCard
          label="Con error"
          value={porEstado.error}
          icon={CircleAlert}
          tone="danger"
          filled={porEstado.error > 0}
          context={porEstado.error > 0 ? 'Reintentables desde el detalle' : 'Sin incidencias'}
        />
      </MetricGrid>

      <DataTable
        title="Cola de salida"
        icon={<Radio size={15} />}
        density="compact"
        search={{ value: q, onChange: setQ, placeholder: 'Buscar por verbo o payload…' }}
        onRowClick={(e) => setDetalleId(e.id)}
        isRowActive={(e) => e.id === detalleId}
        rowTone={(e) => (e.estado === 'error' ? 'danger' : 'default')}
        columns={[
          {
            key: 'verbo',
            header: 'Verbo',
            primary: true,
            sortable: true,
            width: '280px',
            render: (e) => <span className="font-code-serial text-ink">{e.verbo}</span>,
          },
          {
            key: 'estado',
            header: 'Estado',
            width: '130px',
            sortable: true,
            render: (e) => (
              <Pill tone={ESTADO_TONE[e.estado] ?? 'neutral'} dot>
                {ESTADO_LABEL[e.estado] ?? e.estado}
              </Pill>
            ),
          },
          {
            key: 'origenRegistro',
            header: 'Registro de origen',
            sortable: true,
            render: (e) => <span className="font-code-serial">{e.origenRegistro}</span>,
          },
          {
            key: 'origenModulo',
            header: 'Módulo',
            width: '150px',
            secondary: true,
            sortable: true,
          },
          {
            key: 'intentos',
            header: 'Intentos',
            align: 'right',
            width: '100px',
            sortable: true,
            sortValue: (e) => e.intentos,
            render: (e) => <span className="tabular-nums">{e.intentos}</span>,
          },
          {
            key: 'fecha',
            header: 'Fecha',
            align: 'right',
            width: '130px',
            sortable: true,
            sortValue: (e) => e.fecha,
            render: (e) => formatDate(e.fecha),
          },
        ]}
        rowActions={[
          {
            id: 'retry',
            label: 'Reintentar envío',
            icon: <RefreshCw size={14} />,
            onClick: (e) => reintentar(e.id),
          },
        ]}
        rows={rows}
        rowKey={(e) => e.id}
        emptyTitle="Sin eventos en la cola"
        emptyDescription="Ningún mensaje coincide con el verbo y la búsqueda actuales."
      />

      <DetailDrawer
        open={detalle !== undefined}
        onClose={() => setDetalleId(null)}
        title={detalle?.verbo ?? ''}
        subtitle={detalle ? `${detalle.origenModulo} · ${formatDate(detalle.fecha)}` : undefined}
        chips={
          detalle ? (
            <Pill tone={ESTADO_TONE[detalle.estado] ?? 'neutral'} dot>
              {ESTADO_LABEL[detalle.estado] ?? detalle.estado}
            </Pill>
          ) : null
        }
        actions={
          detalle && detalle.estado === 'error' ? (
            <Button leadingIcon={<RefreshCw size={15} />} onClick={() => reintentar(detalle.id)}>
              Reintentar envío
            </Button>
          ) : null
        }
      >
        {detalle ? (
          <>
            <DrawerSection title="Trazabilidad">
              <DrawerFacts
                items={[
                  { label: 'Registro de origen', value: detalle.origenRegistro },
                  { label: 'Módulo', value: detalle.origenModulo },
                  { label: 'Intentos', value: String(detalle.intentos) },
                  { label: 'Fecha', value: formatDate(detalle.fecha) },
                ]}
              />
            </DrawerSection>

            <DrawerSection title="Payload">
              <pre className="scroll-slim overflow-auto whitespace-pre-wrap rounded-sm bg-surface-subtle px-3 py-2.5 font-mono text-body-xs text-ink">
                {prettyPayload(detalle.payload)}
              </pre>
            </DrawerSection>
          </>
        ) : null}
      </DetailDrawer>
    </div>
  )
}
