import { useMemo } from 'react'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
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

export function ReportesPage() {
  const honras = useWarrantyStore((s) => s.honras)
  const baterias = useBatteryStore((s) => s.baterias)
  const articulos = useBatteryStore((s) => s.articulos)
  const certificados = useCertificateStore((s) => s.certificados)
  const dealers = useDistributorStore((s) => s.dealers)
  const dealerNombre = (id?: string) => dealers.find((d) => d.id === id)?.nombre ?? id ?? '—'

  const honrasDealerMes = useMemo(() => {
    const map = new Map<string, { dealerId?: string; mes: string; n: number; usdCliente: number; usdAcreditar: number }>()
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
    return [...map.values()].sort((a, b) => `${a.mes}${a.dealerId}`.localeCompare(`${b.mes}${b.dealerId}`))
  }, [honras, certificados])

  const envejecido = useMemo(() => {
    const now = Date.now()
    return Object.values(baterias)
      .filter((b) => b.ubicacionTipo === 'DEALER')
      .map((b) => ({
        ...b,
        dias: Math.floor((now - new Date(b.fechaIngreso).getTime()) / 86_400_000),
      }))
      .filter((b) => b.dias > 180)
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
    return [...map.values()].sort((a, b) => `${a.dealerId}${a.estado}`.localeCompare(`${b.dealerId}${b.estado}`))
  }, [certificados])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline-lg text-viamar-800">Reportes</h1>

      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-headline-sm">Honras por dealer y mes (USD)</h2>
          <Button
            variant="outlined"
            className="h-8 text-label-md"
            onClick={() =>
              downloadCsv(
                'honras-dealer-mes.csv',
                'dealer,mes,honras,usd_cliente,usd_acreditar',
                honrasDealerMes.map((r) =>
                  [csvCell(dealerNombre(r.dealerId)), r.mes, r.n, r.usdCliente.toFixed(2), r.usdAcreditar.toFixed(2)].join(','),
                ),
              )
            }
          >
            Exportar CSV
          </Button>
        </div>
        <DataTable
          columns={[
            { key: 'dealer', header: 'Dealer', render: (r) => dealerNombre(r.dealerId) },
            { key: 'mes', header: 'Mes' },
            { key: 'n', header: 'Honras', render: (r) => String(r.n) },
            { key: 'usdC', header: 'USD cliente', render: (r) => usd(r.usdCliente) },
            { key: 'usdA', header: 'USD acreditar', render: (r) => usd(r.usdAcreditar) },
          ]}
          rows={honrasDealerMes}
          rowKey={(r) => `${r.dealerId}|${r.mes}`}
          emptyTitle="Sin honras"
          emptyDescription="Las honras ejecutadas se agregan por dealer y mes."
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-headline-sm">Stock envejecido &gt;180 días por dealer ({envejecido.length})</h2>
          <Button
            variant="outlined"
            className="h-8 text-label-md"
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
          >
            Exportar CSV
          </Button>
        </div>
        <DataTable
          columns={[
            { key: 'dealer', header: 'Dealer', render: (b) => dealerNombre(b.ubicacionId) },
            { key: 'serial', header: 'Serial' },
            {
              key: 'art',
              header: 'Artículo',
              render: (b) => articulos.find((a) => a.id === b.articuloId)?.codigo ?? b.articuloId,
            },
            { key: 'ingreso', header: 'Ingreso', render: (b) => formatDate(b.fechaIngreso) },
            { key: 'dias', header: 'Días', render: (b) => String(b.dias) },
          ]}
          rows={envejecido}
          rowKey={(b) => b.serial}
          emptyTitle="Sin stock envejecido"
          emptyDescription="Ninguna batería de dealer supera 180 días de ingreso."
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-headline-sm">Certificados por estado</h2>
          <Button
            variant="outlined"
            className="h-8 text-label-md"
            onClick={() =>
              downloadCsv(
                'certificados-estado.csv',
                'dealer,estado,certificados',
                certsPorEstado.map((r) => [csvCell(dealerNombre(r.dealerId)), r.estado, r.n].join(',')),
              )
            }
          >
            Exportar CSV
          </Button>
        </div>
        <DataTable
          columns={[
            { key: 'dealer', header: 'Dealer', render: (r) => dealerNombre(r.dealerId) },
            {
              key: 'estado',
              header: 'Estado',
              render: (r) => (r.estado === 'E' ? 'E · vigente' : 'C · cancelado'),
            },
            { key: 'n', header: 'Certificados', render: (r) => String(r.n) },
          ]}
          rows={certsPorEstado}
          rowKey={(r) => `${r.dealerId}|${r.estado}`}
          emptyTitle="Sin certificados"
          emptyDescription="Los certificados emitidos se agregan por dealer y estado."
        />
      </section>
    </div>
  )
}
