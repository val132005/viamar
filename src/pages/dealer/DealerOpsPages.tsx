import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { FormField, SelectField } from '../../components/ui/FormField'
import { Timeline } from '../../components/ui/Timeline'
import { EVENT_LABEL } from '../../domain/catalogs'
import { formatDate, iso } from '../../domain/dates'
import { addMonths } from '../../domain/dates'
import { useAuthStore } from '../../stores/authStore'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useWarrantyStore } from '../../stores/warrantyStore'
import { useHistoryStore, withHistory } from '../../stores/historyStore'
import { estadoDealerLabel } from '../honras/DealerAuthPage'
import { solicitarHonraDealer } from '../../stores/actions/honra'
import { useUiStore } from '../../stores/uiStore'
import { useVisibleBatteries } from '../../hooks/useVisibleBatteries'

export function DealerSellPage() {
  const user = useAuthStore((s) => s.usuarioActual)
  const stock = useVisibleBatteries().filter((b) => b.ubicacionTipo === 'DEALER')
  const clientes = useDistributorStore((s) => s.clientes)
  const upsertCert = useCertificateStore((s) => s.upsert)
  const patch = useBatteryStore((s) => s.patchBattery)
  const toast = useUiStore((s) => s.pushToast)
  const [serial, setSerial] = useState(stock[0]?.serial ?? '')
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '')

  function vender() {
    const b = stock.find((x) => x.serial === serial)
    if (!b || !user?.dealerId) {
      toast('Seleccione un serial de su inventario', 'warn')
      return
    }
    const now = new Date()
    patch(serial, { ubicacionTipo: 'CLIENTE', ubicacionId: clienteId })
    upsertCert({
      id: `cert-${serial}-${Date.now()}`,
      serial,
      clienteId,
      dealerId: user.dealerId,
      facturaNcf: `B01${String(Date.now()).slice(-8)}`,
      fechaVenta: iso(now),
      fechaActivacion: iso(now),
      fechaFinFull: iso(addMonths(now, 12)),
      fechaFinProrrateo: iso(addMonths(now, 24)),
      estado: 'E',
      vehiculo: { marca: 'KIA', modelo: 'Rio', anio: 2021 },
      tipoUsoId: 'AUTOMOVIL',
    })
    withHistory(serial, 'VENTA_CLIENTE', 'Venta reportada por el dealer', () => undefined, {
      estadoNuevo: 'CLIENTE',
    })
    withHistory(serial, 'CERTIFICADO', 'CERT-E emitido', () => undefined, { estadoNuevo: 'E' })
    toast('Venta y certificado registrados', 'ok')
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <h1 className="text-headline-lg text-viamar-800">Reportar venta</h1>
      <SelectField label="Serial en mi inventario" value={serial} onChange={(e) => setSerial(e.target.value)}>
        {stock.map((b) => (
          <option key={b.serial} value={b.serial}>
            {b.serial}
          </option>
        ))}
      </SelectField>
      <SelectField label="Cliente final" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre} · {c.documento}
          </option>
        ))}
      </SelectField>
      <Button onClick={vender} disabled={stock.length === 0}>
        Emitir certificado
      </Button>
    </div>
  )
}

export function DealerHonraPage() {
  const visibles = useVisibleBatteries()
  const vendidas = visibles.filter((b) => b.ubicacionTipo === 'CLIENTE')
  const honras = useWarrantyStore((s) => s.honras)
  const eventos = useHistoryStore((s) => s.eventos)
  const certificados = useCertificateStore((s) => s.certificados)
  const mine = honras.filter((h) => visibles.some((b) => b.serial === h.serialOriginal))
  const toast = useUiStore((s) => s.pushToast)
  const [serial, setSerial] = useState(vendidas[0]?.serial ?? '')
  const [capacidad, setCapacidad] = useState('80')
  const [detalleId, setDetalleId] = useState(mine[0]?.id ?? '')
  const detalle = mine.find((h) => h.id === detalleId) ?? mine[0]
  const traza = detalle
    ? eventos
        .filter((e) => e.serial === detalle.serialOriginal || e.serial === detalle.serialReemplazo)
        .slice()
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
    : []
  const certOriginal = detalle
    ? certificados.filter((c) => c.serial === detalle.serialOriginal).slice(-1)[0]
    : undefined

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-headline-lg text-viamar-800">Honra piloto</h1>
      <div className="flex flex-wrap items-end gap-2">
        <SelectField label="Serial vendido" value={serial} onChange={(e) => setSerial(e.target.value)}>
          {vendidas.map((b) => (
            <option key={b.serial} value={b.serial}>
              {b.serial}
            </option>
          ))}
        </SelectField>
        <FormField
          label="CCA medido"
          value={capacidad}
          onChange={(e) => setCapacidad(e.target.value)}
          inputMode="numeric"
        />
        <Button
          onClick={() => {
            const r = solicitarHonraDealer(serial, Number(capacidad) || 80)
            toast(r.ok ? 'Solicitud enviada a Garantías' : r.error, r.ok ? 'ok' : 'error')
          }}
        >
          Solicitar honra
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'serialOriginal', header: 'Serial' },
          { key: 'estado', header: 'Estado', render: (h) => estadoDealerLabel(h.estado) },
          { key: 'decisionVigencia', header: 'Vigencia' },
          {
            key: 'reemplazo',
            header: 'Reemplazo',
            render: (h) =>
              h.serialReemplazo ? (
                <Link className="font-code-serial text-viamar-700" to={`/serial/${h.serialReemplazo}`}>
                  {h.serialReemplazo}
                </Link>
              ) : (
                '—'
              ),
          },
          {
            key: 'ver',
            header: '',
            render: (h) => (
              <Button variant="outlined" className="h-8 text-label-md" onClick={() => setDetalleId(h.id)}>
                Trazabilidad
              </Button>
            ),
          },
        ]}
        rows={mine}
        rowKey={(h) => h.id}
        emptyTitle="Sin solicitudes"
        emptyDescription="Solicite la honra de un serial vendido y siga su estado aquí."
      />
      {detalle ? (
        <section className="flex flex-col gap-2 bg-white border border-app-border rounded p-4">
          <h2 className="text-headline-sm">
            {detalle.serialOriginal} · {estadoDealerLabel(detalle.estado)}
          </h2>
          <p className="text-body-sm text-ink-secondary">
            Vigencia {detalle.decisionVigencia} · USD cliente {detalle.resultadoCalculo.montoCliente.toFixed(2)}
            {detalle.serialReemplazo ? ` · reemplazo ${detalle.serialReemplazo}` : ''}
            {detalle.resultadoCalculo.motivoRechazo ? ` · motivo: ${detalle.resultadoCalculo.motivoRechazo}` : ''}
            {certOriginal ? ` · certificado original ${certOriginal.estado === 'C' ? 'CANCELADO (C)' : 'vigente (E)'}` : ''}
          </p>
          <Timeline
            numbered={false}
            events={traza.map((e) => ({
              id: e.id,
              title: EVENT_LABEL[e.tipo] ?? e.tipo,
              description: e.descripcion,
              date: formatDate(e.fecha),
              origenId: e.origen,
            }))}
          />
        </section>
      ) : null}
    </div>
  )
}

export function DealerCertsPage() {
  const user = useAuthStore((s) => s.usuarioActual)
  const certificados = useCertificateStore((s) => s.certificados)
  const mine = useMemo(
    () => certificados.filter((c) => c.dealerId === user?.dealerId),
    [certificados, user?.dealerId],
  )
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-headline-lg text-viamar-800">Mis certificados</h1>
      <DataTable
        columns={[
          {
            key: 'serial',
            header: 'Serial',
            render: (c) => (
              <Link className="font-code-serial text-viamar-700" to={`/serial/${c.serial}`}>
                {c.serial}
              </Link>
            ),
          },
          { key: 'estado', header: 'Estado' },
          { key: 'ncf', header: 'NCF', render: (c) => c.facturaNcf },
        ]}
        rows={mine}
        rowKey={(c) => c.id}
      />
    </div>
  )
}

export function DealerHonraNuevaPage() {
  return <DealerHonraPage />
}
