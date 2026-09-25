import { useMemo, useState } from 'react'
import { BadgeCheck, Clock, Coins, Download, Shield } from 'lucide-react'
import { DonaEstado, PanelHeader, Ranking, type SegmentoDona } from '../../components/panel/PanelWidgets'
import { PANEL } from '../../components/panel/tonos'
import { MetricCard } from '../../components/ui/MetricCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { cn } from '../../lib/cn'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { Pill } from '../../components/ui/Pill'
import { SerialCell } from '../../components/ui/SerialCell'
import { formatDate } from '../../domain/dates'
import { usd } from '../../domain/money'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useWarrantyStore } from '../../stores/warrantyStore'

function downloadCsv(filename: string, header: string, lines: string[]) {
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

const AGE_LIMIT_DAYS = 180

type ReporteId = 'honras' | 'envejecido' | 'garantia'

/** Botón de exportación: mismo gesto en los tres informes. */
function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" leadingIcon={<Download size={14} />} onClick={onClick}>
      Exportar CSV
    </Button>
  )
}

export function ReportesPage() {
  const honras = useWarrantyStore((s) => s.honras)
  const baterias = useBatteryStore((s) => s.baterias)
  const articulos = useBatteryStore((s) => s.articulos)
  const certificados = useCertificateStore((s) => s.certificados)
  const dealers = useDistributorStore((s) => s.dealers)
  const dealerNombre = (id?: string) => dealers.find((d) => d.id === id)?.nombre ?? id ?? '—'

  const [tab, setTab] = useState<ReporteId>('honras')

  const honrasDealerMes = useMemo(() => {
    const map = new Map<
      string,
      { dealerId?: string; mes: string; n: number; usdCliente: number; usdAcreditar: number }
    >()
    for (const h of honras) {
      const certs = certificados.filter((c) => c.serial === h.serialOriginal)
      const dealerId = certs[certs.length - 1]?.dealerId
      const mes = h.fechaCalculo.slice(0, 7)
      const key = `${dealerId ?? '—'}|${mes}`
      const cur = map.get(key) ?? { dealerId, mes, n: 0, usdCliente: 0, usdAcreditar: 0 }
      cur.n += 1
      cur.usdCliente += h.resultadoCalculo.montoCliente
      cur.usdAcreditar += h.resultadoCalculo.montoAcreditar
      map.set(key, cur)
    }
    return [...map.values()].sort((a, b) =>
      `${a.mes}${a.dealerId}`.localeCompare(`${b.mes}${b.dealerId}`),
    )
  }, [honras, certificados])

  const envejecido = useMemo(() => {
    const now = Date.now()
    return Object.values(baterias)
      .filter((b) => b.ubicacionTipo === 'DEALER')
      .map((b) => ({
        ...b,
        dias: Math.floor((now - new Date(b.fechaIngreso).getTime()) / 86_400_000),
      }))
      .filter((b) => b.dias > AGE_LIMIT_DAYS)
      .sort((a, b) => b.dias - a.dias)
  }, [baterias])

  const certsPorEstado = useMemo(() => {
    const map = new Map<string, { dealerId?: string; estado: string; n: number }>()
    for (const c of certificados) {
      const key = `${c.dealerId ?? '—'}|${c.estado}`
      const cur = map.get(key) ?? { dealerId: c.dealerId, estado: c.estado, n: 0 }
      cur.n += 1
      map.set(key, cur)
    }
    return [...map.values()].sort((a, b) =>
      `${a.dealerId}${a.estado}`.localeCompare(`${b.dealerId}${b.estado}`),
    )
  }, [certificados])

  const enDealer = Object.values(baterias).filter((b) => b.ubicacionTipo === 'DEALER').length
  const acreditadoTotal = honras.reduce((a, h) => a + h.resultadoCalculo.montoAcreditar, 0)
  const clienteTotal = honras.reduce((a, h) => a + h.resultadoCalculo.montoCliente, 0)
  const cancelados = certificados.filter((c) => c.estado === 'C').length

  /* El bloque analítico acompaña al informe abierto: cada pestaña trae su
     propia distribución y su ranking por dealer. */
  const sumaPorDealer = (pares: Array<[string | undefined, number]>) => {
    const mapa = new Map<string, number>()
    for (const [id, n] of pares) {
      const k = dealerNombre(id)
      mapa.set(k, (mapa.get(k) ?? 0) + n)
    }
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, valor]) => ({ id: label, label, valor }))
  }
  const analitica: { dona: SegmentoDona[]; unidad: string; tituloDona: string; tituloRanking: string; ranking: ReturnType<typeof sumaPorDealer>; total: number } =
    tab === 'honras'
      ? {
          tituloDona: 'Honras por desenlace',
          unidad: 'honras',
          dona: [
            { id: 'ok', label: 'Ejecutadas', valor: honras.filter((h) => h.estado === 'EJECUTADA' || h.estado === 'APROBADA').length, tono: 'ok' },
            { id: 'ko', label: 'Rechazadas', valor: honras.filter((h) => h.estado === 'RECHAZADA').length, tono: 'danger' },
            { id: 'pend', label: 'Pendientes', valor: honras.filter((h) => h.estado === 'SOLICITADA').length, tono: 'warn' },
          ],
          tituloRanking: 'Honras por dealer',
          ranking: sumaPorDealer(honrasDealerMes.map((r) => [r.dealerId, r.n])),
          total: honras.length,
        }
      : tab === 'envejecido'
        ? {
            tituloDona: 'Stock en dealers por antigüedad',
            unidad: 'baterías',
            dona: [
              { id: 'regla', label: `Hasta ${AGE_LIMIT_DAYS} días`, valor: enDealer - envejecido.length, tono: 'ok' },
              { id: 'aged', label: `Más de ${AGE_LIMIT_DAYS} días`, valor: envejecido.length, tono: 'warn' },
            ],
            tituloRanking: 'Stock envejecido por dealer',
            ranking: sumaPorDealer(envejecido.map((b) => [b.ubicacionId, 1])),
            total: envejecido.length,
          }
        : {
            tituloDona: 'Certificados por estado',
            unidad: 'certificados',
            dona: [
              { id: 'E', label: 'CERT-E vigentes', valor: certificados.length - cancelados, tono: 'ok' },
              { id: 'C', label: 'CERT-C cancelados', valor: cancelados, tono: 'danger' },
            ],
            tituloRanking: 'Certificados por dealer',
            ranking: sumaPorDealer(certsPorEstado.map((r) => [r.dealerId, r.n])),
            total: certificados.length,
          }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        title="Reportes"
        description="Agregados listos para exportar. Cada informe se calcula sobre los datos vivos del prototipo."
        tabs={
          <PageTabs
            active={tab}
            onChange={(id) => setTab(id as ReporteId)}
            tabs={[
              { id: 'honras', label: 'Honras por dealer', count: honrasDealerMes.length },
              {
                id: 'envejecido',
                label: 'Stock envejecido',
                count: envejecido.length,
                tone: envejecido.length > 0 ? 'danger' : 'default',
              },
              { id: 'garantia', label: 'Uso de garantía', count: certsPorEstado.length },
            ]}
          />
        }
      />

      <MetricGrid columns={4}>
        <MetricCard label="Honras registradas" value={honras.length} icon={Shield} tone="brand" context={`${honrasDealerMes.length} combinaciones dealer · mes`} />
        <MetricCard label="USD acreditado" value={usd(acreditadoTotal)} icon={Coins} tone="accent" context={`Cliente asumió ${usd(clienteTotal)}`} />
        <MetricCard
          label="Stock envejecido"
          value={envejecido.length}
          note={`de ${enDealer}`}
          icon={Clock}
          tone="warn"
          context={`Más de ${AGE_LIMIT_DAYS} días en dealer`}
        />
        <MetricCard
          label="Certificados cancelados"
          value={cancelados}
          note={`de ${certificados.length}`}
          icon={BadgeCheck}
          tone="danger"
          filled={cancelados > 0}
          context="Bloquean la honra de su serial"
        />
      </MetricGrid>

      <div className="grid gap-3.5 lg:grid-cols-[45fr_55fr]">
        <section className={cn(PANEL, 'min-w-0 px-4 pb-4 pt-3.5')}>
          <PanelHeader title={analitica.tituloDona} />
          <div className="mt-3">
            <DonaEstado segmentos={analitica.dona} unidad={analitica.unidad} />
          </div>
        </section>
        <section className={cn(PANEL, 'min-w-0 px-4 pb-3 pt-3.5')}>
          <PanelHeader title={analitica.tituloRanking} />
          <div className="mt-1.5">
            <Ranking filas={analitica.ranking} total={analitica.total} />
          </div>
        </section>
      </div>

      {tab === 'honras' ? (
        <DataTable
          title="Honras por dealer y mes"
          fill={false}
          actions={
            <ExportButton
              onClick={() =>
                downloadCsv(
                  'honras-dealer-mes.csv',
                  'dealer,mes,honras,usd_cliente,usd_acreditar',
                  honrasDealerMes.map((r) =>
                    [
                      csvCell(dealerNombre(r.dealerId)),
                      r.mes,
                      r.n,
                      r.usdCliente.toFixed(2),
                      r.usdAcreditar.toFixed(2),
                    ].join(','),
                  ),
                )
              }
            />
          }
          columns={[
            {
              key: 'dealer',
              header: 'Dealer',
              primary: true,
              sortable: true,
              sortValue: (r) => dealerNombre(r.dealerId),
              render: (r) => dealerNombre(r.dealerId),
            },
            { key: 'mes', header: 'Mes', width: '120px', sortable: true },
            {
              key: 'n',
              header: 'Honras',
              align: 'right',
              width: '100px',
              sortable: true,
              sortValue: (r) => r.n,
              render: (r) => String(r.n),
            },
            {
              key: 'usdC',
              header: 'USD cliente',
              align: 'right',
              width: '140px',
              sortable: true,
              sortValue: (r) => r.usdCliente,
              render: (r) => usd(r.usdCliente),
            },
            {
              key: 'usdA',
              header: 'USD acreditar',
              align: 'right',
              width: '150px',
              sortable: true,
              sortValue: (r) => r.usdAcreditar,
              render: (r) => <span className="text-ink">{usd(r.usdAcreditar)}</span>,
            },
          ]}
          rows={honrasDealerMes}
          rowKey={(r) => `${r.dealerId}|${r.mes}`}
          emptyTitle="Sin honras"
          emptyDescription="Las honras ejecutadas se agregan aquí por dealer y mes."
        />
      ) : null}

      {tab === 'envejecido' ? (
        <DataTable
          title={`Stock envejecido (más de ${AGE_LIMIT_DAYS} días)`}
          fill={false}
          actions={
            <ExportButton
              onClick={() =>
                downloadCsv(
                  'stock-envejecido.csv',
                  'dealer,serial,articulo,fecha_ingreso,dias',
                  envejecido.map((b) =>
                    [
                      csvCell(dealerNombre(b.ubicacionId)),
                      b.serial,
                      csvCell(articulos.find((a) => a.id === b.articuloId)?.codigo ?? b.articuloId),
                      b.fechaIngreso.slice(0, 10),
                      b.dias,
                    ].join(','),
                  ),
                )
              }
            />
          }
          columns={[
            {
              key: 'dealer',
              header: 'Dealer',
              primary: true,
              sortable: true,
              sortValue: (b) => dealerNombre(b.ubicacionId),
              render: (b) => dealerNombre(b.ubicacionId),
            },
            {
              key: 'serial',
              header: 'Serial',
              width: '160px',
              sortable: true,
              render: (b) => <SerialCell serial={b.serial} />,
            },
            {
              key: 'art',
              header: 'Artículo',
              width: '150px',
              sortable: true,
              sortValue: (b) => articulos.find((a) => a.id === b.articuloId)?.codigo ?? b.articuloId,
              render: (b) => articulos.find((a) => a.id === b.articuloId)?.codigo ?? b.articuloId,
            },
            {
              key: 'ingreso',
              header: 'Ingreso',
              width: '140px',
              sortable: true,
              sortValue: (b) => b.fechaIngreso,
              render: (b) => formatDate(b.fechaIngreso),
            },
            {
              key: 'dias',
              header: 'Días en stock',
              align: 'right',
              width: '130px',
              sortable: true,
              sortValue: (b) => b.dias,
              render: (b) => (
                <span className="font-semibold tabular-nums text-warning-text">{b.dias}</span>
              ),
            },
          ]}
          rows={envejecido}
          rowKey={(b) => b.serial}
          emptyTitle="Sin stock envejecido"
          emptyDescription={`Ninguna batería en dealer supera los ${AGE_LIMIT_DAYS} días desde su ingreso.`}
        />
      ) : null}

      {tab === 'garantia' ? (
        <DataTable
          title="Uso de garantía por dealer"
          fill={false}
          actions={
            <ExportButton
              onClick={() =>
                downloadCsv(
                  'certificados-estado.csv',
                  'dealer,estado,certificados',
                  certsPorEstado.map((r) =>
                    [csvCell(dealerNombre(r.dealerId)), r.estado, r.n].join(','),
                  ),
                )
              }
            />
          }
          columns={[
            {
              key: 'dealer',
              header: 'Dealer',
              primary: true,
              sortable: true,
              sortValue: (r) => dealerNombre(r.dealerId),
              render: (r) => dealerNombre(r.dealerId),
            },
            {
              key: 'estado',
              header: 'Estado del certificado',
              width: '220px',
              sortable: true,
              render: (r) =>
                r.estado === 'E' ? (
                  <Pill tone="ok" dot>
                    CERT-E · vigente
                  </Pill>
                ) : (
                  <Pill tone="danger" dot>
                    CERT-C · cancelado
                  </Pill>
                ),
            },
            {
              key: 'n',
              header: 'Certificados',
              align: 'right',
              width: '140px',
              sortable: true,
              sortValue: (r) => r.n,
              render: (r) => String(r.n),
            },
          ]}
          rows={certsPorEstado}
          rowKey={(r) => `${r.dealerId}|${r.estado}`}
          emptyTitle="Sin certificados"
          emptyDescription="Los certificados emitidos se agregan aquí por dealer y estado."
        />
      ) : null}
    </div>
  )
}
