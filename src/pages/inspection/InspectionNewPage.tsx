import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { FormField, SelectField } from '../../components/ui/FormField'
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

  return (
    <div className="flex flex-col gap-4">
      <Link className="text-label-md text-viamar-700" to="/gestion-tecnica">
        ← Volver a gestión técnica
      </Link>
      <h1 className="text-headline-lg text-viamar-800">Nueva solicitud de chequeo</h1>

      <section className="grid gap-3 surface p-4 md:grid-cols-2">
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
        <div className="grid grid-cols-2 gap-3">
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
      </section>

      <section className="flex flex-col gap-2 surface p-4">
        <h2 className="text-headline-sm text-viamar-800">Seriales ({lineas.length})</h2>
        {lineas.length === 0 ? (
          <p className="text-body-sm text-ink-secondary">
            Selecciona seriales del inventario del dealer para agregarlos como líneas.
          </p>
        ) : (
          lineas.map((l) => (
            <div key={l.serial} className="grid grid-cols-2 gap-2 rounded bg-app-surface-alt p-3 md:grid-cols-5 md:items-end">
              <p className="font-code-serial text-viamar-700 md:col-span-1 col-span-2">{l.serial}</p>
              <FormField label="Voltaje (V)" type="number" step="0.1" value={l.voltaje} onChange={(e) => editar(l.serial, 'voltaje', e.target.value)} />
              <FormField label="Densidad" type="number" step="0.01" value={l.densidad} onChange={(e) => editar(l.serial, 'densidad', e.target.value)} />
              <FormField label="CCA (%)" type="number" step="1" value={l.capacidadMedida} onChange={(e) => editar(l.serial, 'capacidadMedida', e.target.value)} />
              <Button variant="ghost" className="h-8 text-label-md" onClick={() => quitar(l.serial)}>
                Quitar
              </Button>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2 surface p-4">
        <h2 className="text-headline-sm text-viamar-800">Inventario del dealer</h2>
        {inventario.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Sin seriales disponibles"
            description="No hay más seriales en el inventario de este dealer."
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {inventario.slice(0, 20).map((b) => (
              <li key={b.serial} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-viamar-50">
                <span className="font-code-serial text-body-sm">{b.serial}</span>
                <Button variant="outlined" className="h-8 text-label-md" onClick={() => agregar(b.serial)}>
                  Agregar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? <p className="text-body-sm text-danger">{error}</p> : null}
      <div>
        <Button onClick={crear}>Crear solicitud en PENDIENTE</Button>
      </div>
    </div>
  )
}
