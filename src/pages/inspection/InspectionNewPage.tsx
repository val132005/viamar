import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Plus,
  Stethoscope,
  TriangleAlert,
  Warehouse,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { FormField, SelectField } from '../../components/ui/FormField'
import { PageHeader } from '../../components/ui/PageHeader'
import { SectionCard } from '../../components/ui/SectionCard'
import { SerialCell } from '../../components/ui/SerialCell'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useBatteryStore } from '../../stores/batteryStore'
import { iso } from '../../domain/dates'
import { sugerirDiagnostico } from '../../domain/diagnosis'
import type { LineaDiagnostico } from '../../domain/entities'
import { useVisibleBatteries } from '../../hooks/useVisibleBatteries'
import { DEMO_ACCOUNTS } from '../../seed/demoAccounts'
import { useChargingStore } from '../../stores/chargingStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { withHistory } from '../../stores/historyStore'

type DraftLinea = {
  serial: string
  voltaje: number
  densidad: number
  capacidadMedida: number
}

export function InspectionNewPage() {
  const navigate = useNavigate()
  const dealers = useDistributorStore((s) => s.dealers)
  const centros = useChargingStore((s) => s.centros)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const addSolicitud = useInspectionStore((s) => s.addSolicitud)
  const visibles = useVisibleBatteries()
  const articulos = useBatteryStore((s) => s.articulos)

  const [dealerId, setDealerId] = useState(dealers[0]?.id ?? '')
  const [centroId, setCentroId] = useState(centros[0]?.id ?? '')
  const [fechaVisita, setFechaVisita] = useState(() => new Date().toISOString().slice(0, 10))
  const [vendedorId, setVendedorId] = useState('usr-fraisi')
  const [supervisorId, setSupervisorId] = useState('usr-elizabeth')
  const [lineas, setLineas] = useState<DraftLinea[]>([])
  const [error, setError] = useState('')

  const inventario = useMemo(
    () =>
      visibles.filter(
        (b) =>
          b.ubicacionTipo === 'DEALER' &&
          (dealerId === '' || b.ubicacionId === dealerId) &&
          !lineas.some((l) => l.serial === b.serial),
      ),
    [visibles, dealerId, lineas],
  )

  function agregar(serial: string) {
    setLineas((prev) => [...prev, { serial, voltaje: 12.4, densidad: 1.24, capacidadMedida: 80 }])
  }

  function editar(serial: string, field: keyof Omit<DraftLinea, 'serial'>, raw: string) {
    const value = Number(raw)
    if (Number.isNaN(value)) return
    setLineas((prev) => prev.map((l) => (l.serial === serial ? { ...l, [field]: value } : l)))
  }

  function quitar(serial: string) {
    setLineas((prev) => prev.filter((l) => l.serial !== serial))
  }

  function crear() {
    if (!dealerId || !centroId) {
      setError('Selecciona dealer y centro de carga.')
      return
    }
    if (lineas.length === 0) {
      setError('Agrega al menos un serial del inventario del dealer.')
      return
    }
    const max = solicitudes.reduce((acc, s) => {
      const m = /SCH-2026-(\d+)/.exec(s.numero)
      return m ? Math.max(acc, Number(m[1])) : acc
    }, 0)
    const numero = `SCH-2026-${String(max + 1).padStart(3, '0')}`
    const id = `sch-${Date.now()}`
    const lineasFinales: LineaDiagnostico[] = lineas.map((l, i) => {
      const sug = sugerirDiagnostico(l.voltaje, l.densidad, l.capacidadMedida)
      return {
        id: `lin-${id}-${i}`,
        serial: l.serial,
        voltaje: l.voltaje,
        densidad: l.densidad,
        capacidadMedida: l.capacidadMedida,
        diagnostico: sug.diagnostico,
        accionSugerida: sug.accion,
      }
    })
    const solicitud = {
      id,
      numero,
      dealerId,
      vendedorId,
      supervisorId,
      estado: 'PENDIENTE' as const,
      fechaCreacion: iso(new Date()),
      fechaVisita: iso(new Date(`${fechaVisita}T12:00:00`)),
      centroId,
      lineas: lineasFinales,
    }
    addSolicitud(solicitud)
    for (const l of lineasFinales) {
      withHistory(l.serial, 'CHEQUEO', `${numero} creada · medición inicial`, () => undefined, {
        referenciaId: id,
        estadoNuevo: l.diagnostico,
      })
    }
    navigate(`/gestion-tecnica/${id}`)
  }

  const dealer = dealers.find((d) => d.id === dealerId)

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        breadcrumbs={[{ label: 'Gestión técnica', to: '/gestion-tecnica' }, { label: 'Nueva solicitud' }]}
        title="Nueva solicitud de chequeo"
        description="Programa una visita técnica: elige el distribuidor, el centro de carga y las baterías que se van a medir."
        actions={
          <>
            <Link to="/gestion-tecnica">
              <Button variant="outlined">Cancelar</Button>
            </Link>
            <Button leadingIcon={<ClipboardCheck size={15} />} onClick={crear}>
              Crear solicitud
            </Button>
          </>
        }
      />

      {error ? (
        <p
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-critical-border/60 bg-gradient-to-br from-critical-soft/40 to-critical-soft/80 px-4 py-2.5 text-body-sm text-critical-text"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-critical">
            <TriangleAlert size={16} aria-hidden="true" />
          </span>
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <SectionCard title="Datos de la visita" icon={<CalendarDays />}>
            <div className="grid gap-3.5 md:grid-cols-2">
              <SelectField label="Dealer" value={dealerId} onChange={(e) => setDealerId(e.target.value)}>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Centro de carga" value={centroId} onChange={(e) => setCentroId(e.target.value)}>
                {centros.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </SelectField>
              <FormField
                label="Fecha de visita"
                type="date"
                value={fechaVisita}
                onChange={(e) => setFechaVisita(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3.5">
                <SelectField label="Vendedor" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                  {DEMO_ACCOUNTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Supervisor" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
                  {DEMO_ACCOUNTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={`Líneas de la solicitud (${lineas.length})`}
            description="Medición inicial de cada batería. El diagnóstico se sugiere al guardar."
            icon={<Stethoscope />}
          >
            {lineas.length === 0 ? (
              <EmptyState
                size="sm"
                icon={ClipboardList}
                title="Sin baterías todavía"
                description="Agrega seriales desde el inventario del dealer, a la derecha."
              />
            ) : (
              <ol className="flex flex-col gap-2.5">
                {lineas.map((l, idx) => (
                  <li
                    key={l.serial}
                    className="grid grid-cols-2 items-end gap-3 rounded-lg border border-[#e6edf5] bg-[#f7fafd] p-3 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))_auto]"
                  >
                    <div className="col-span-2 flex items-center gap-2.5 self-center md:col-span-1">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-viamar-50 text-label-md font-bold tabular-nums text-viamar-600">
                        {idx + 1}
                      </span>
                      <SerialCell serial={l.serial} />
                    </div>
                    <FormField label="Voltaje (V)" type="number" step="0.1" value={l.voltaje} onChange={(e) => editar(l.serial, 'voltaje', e.target.value)} />
                    <FormField label="Densidad" type="number" step="0.01" value={l.densidad} onChange={(e) => editar(l.serial, 'densidad', e.target.value)} />
                    <FormField label="CCA (%)" type="number" step="1" value={l.capacidadMedida} onChange={(e) => editar(l.serial, 'capacidadMedida', e.target.value)} />
                    <Button variant="danger-quiet" size="sm" leadingIcon={<X size={13} />} onClick={() => quitar(l.serial)}>
                      Quitar
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Inventario del dealer"
          description={dealer ? `${inventario.length} seriales disponibles en ${dealer.nombre}` : undefined}
          icon={<Warehouse />}
          flush
        >
          {inventario.length === 0 ? (
            <EmptyState
              size="sm"
              icon={ClipboardList}
              title="Sin seriales disponibles"
              description="No hay más seriales en el inventario de este dealer."
            />
          ) : (
            <ul className="scroll-slim max-h-[560px] divide-y divide-[#edf1f6] overflow-y-auto px-4 font-inter tracking-[-0.01em]">
              {inventario.slice(0, 20).map((b) => (
                <li key={b.serial} className="-mx-2 flex items-center gap-3 rounded-sm px-2 py-2 transition-colors duration-fast hover:bg-[#f7fafd]">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-viamar-500">{b.serial}</span>
                    <span className="block truncate text-[11px] text-[#7a8799]">
                      {articulos.find((a) => a.id === b.articuloId)?.descripcion ?? b.articuloId}
                    </span>
                  </span>
                  <StatusBadge catalogId={b.diagnosticoId} />
                  <button
                    type="button"
                    onClick={() => agregar(b.serial)}
                    className="inline-flex h-[27px] items-center gap-1 rounded-[6px] border border-[#cfdbe8] bg-white px-2.5 text-[12px] font-semibold text-viamar-500 transition-colors duration-fast hover:border-viamar-300 hover:bg-viamar-50"
                  >
                    <Plus size={13} aria-hidden="true" />
                    Agregar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
