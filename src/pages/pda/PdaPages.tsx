import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BatteryCharging, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormField, SelectField } from '../../components/ui/FormField'
import { Pill } from '../../components/ui/Pill'
import { ProgressBar } from '../../components/ui/ProcessSteps'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { cn } from '../../lib/cn'
import { iso } from '../../domain/dates'
import { normalizeSerial } from '../../domain/serial'
import type { LineaDiagnostico } from '../../domain/entities'
import { PdaHomePage } from './PdaHomePage'
import { clearPdaVisit, loadPdaVisit, savePdaVisit } from './pdaVisit'
import { useAuthStore } from '../../stores/authStore'
import { useBatteryStore } from '../../stores/batteryStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { withHistory } from '../../stores/historyStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { useUiStore } from '../../stores/uiStore'

export { PdaHomePage }

const DIAG_ACCION: Record<string, string> = {
  BUEN_ESTADO: 'Sin acción',
  DESCARGADA: 'Enviar a carga',
  PARA_GARANTIA: 'Analizar garantía',
}

/** Los tres dictámenes del PDA, con la acción que cada uno desencadena. */
const DICTAMENES = [
  {
    id: 'BUEN_ESTADO',
    label: 'Buen estado',
    hint: DIAG_ACCION.BUEN_ESTADO,
    icon: CheckCircle2,
    tint: 'bg-success-soft text-success-text',
  },
  {
    id: 'DESCARGADA',
    label: 'Descargada',
    hint: DIAG_ACCION.DESCARGADA,
    icon: BatteryCharging,
    tint: 'bg-warning-soft text-warning-text',
  },
  {
    id: 'PARA_GARANTIA',
    label: 'Para garantía',
    hint: DIAG_ACCION.PARA_GARANTIA,
    icon: ShieldAlert,
    tint: 'bg-critical-soft text-critical-text',
  },
] as const

export function PdaConteoPage() {
  const baterias = useBatteryStore((s) => s.baterias)
  const dealers = useDistributorStore((s) => s.dealers)
  const defaultDealer = dealers[0]?.id ?? ''
  const [visit, setVisit] = useState(() => loadPdaVisit(defaultDealer))
  const [q, setQ] = useState('')

  const esperado = useMemo(
    () =>
      Object.values(baterias)
        .filter((b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === visit.dealerId)
        .map((b) => b.serial)
        .sort(),
    [baterias, visit.dealerId],
  )
  const faltantes = esperado.filter((s) => !visit.seen.includes(s))
  const sobrantes = visit.seen.filter((s) => !esperado.includes(s))

  function persist(next: typeof visit) {
    setVisit(next)
    savePdaVisit(next)
  }

  function add() {
    const s = normalizeSerial(q)
    if (!s) return
    if (!visit.seen.includes(s)) persist({ ...visit, seen: [...visit.seen, s] })
    setQ('')
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-headline-xl text-ink">Conteo</h1>

      <div className="flex flex-col gap-3">
        <SelectField
          label="Dealer en visita"
          value={visit.dealerId}
          onChange={(e) => persist({ dealerId: e.target.value, seen: [], diagnosticos: {} })}
        >
          {dealers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </SelectField>
        <FormField
          label="Escanear"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            /* El lector de código emite Enter al final de la lectura: sin esto
               habría que tocar el botón después de cada escaneo. */
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          className="font-code-serial"
          placeholder="CIB-…"
        />
        <Button className="h-12 w-full text-label-lg" onClick={add}>
          Registrar
        </Button>
      </div>

      {/* Avance del conteo: lo que el técnico mira entre lectura y lectura. */}
      <div className="rounded-xl border border-line bg-white p-4 shadow-xs">
        <ProgressBar done={visit.seen.length} total={esperado.length} />
        <p className="mt-2.5 text-body-sm text-ink-secondary">
          Contados <strong className="tabular-nums text-ink">{visit.seen.length}</strong> /
          esperados <strong className="tabular-nums text-ink">{esperado.length}</strong>
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-body-sm text-ink-secondary">
          <span className={faltantes.length > 0 ? 'text-warning-text' : undefined}>
            Faltantes <span className="tabular-nums font-semibold">{faltantes.length}</span>
          </span>
          <span aria-hidden="true" className="text-ink-disabled">
            ·
          </span>
          <span className={sobrantes.length > 0 ? 'text-critical-text' : undefined}>
            Sobrantes <span className="tabular-nums font-semibold">{sobrantes.length}</span>
          </span>
        </p>
      </div>

      {faltantes.length > 0 ? <SerialList title="Faltantes" seriales={faltantes} /> : null}
      {sobrantes.length > 0 ? <SerialList title="Sobrantes" seriales={sobrantes} /> : null}

      <Link
        to="/pda/resumen"
        className="text-label-lg text-viamar-600 underline-offset-2 hover:underline"
      >
        Ir al cierre de visita
      </Link>
    </div>
  )
}

/** Lista de seriales de una discrepancia: el título queda fuera de la tarjeta. */
function SerialList({ title, seriales }: { title: string; seriales: string[] }) {
  return (
    <section>
      <h2 className="mb-2 text-headline-sm text-ink">{title}</h2>
      <ul className="divide-y divide-[#edf1f6] overflow-hidden rounded-xl border border-line bg-white shadow-xs">
        {seriales.map((s) => (
          <li key={s} className="px-3.5 py-2.5 text-body-sm font-semibold tabular-nums text-viamar-500">
            {s}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PdaDiagnosticoPage() {
  const { serial: raw = '' } = useParams()
  const navigate = useNavigate()
  const serial = normalizeSerial(raw)
  const bateria = useBatteryStore((s) => s.baterias[serial])
  const patchBattery = useBatteryStore((s) => s.patchBattery)
  const toast = useUiStore((s) => s.pushToast)
  const dealers = useDistributorStore((s) => s.dealers)
  const [q, setQ] = useState(serial === 'CIB-00000000' ? '' : serial)
  const esBusqueda = serial === 'CIB-00000000'

  function dictaminar(diagnostico: string) {
    if (!bateria) {
      toast('Serial no encontrado', 'error')
      return
    }
    patchBattery(serial, { diagnosticoId: diagnostico })
    withHistory(serial, 'DIAGNOSTICO', `Dictamen PDA · ${diagnostico}`, () => undefined, {
      estadoNuevo: diagnostico,
    })
    const visit = loadPdaVisit(dealers[0]?.id ?? '')
    if (!visit.seen.includes(serial)) visit.seen.push(serial)
    visit.diagnosticos[serial] = diagnostico
    savePdaVisit(visit)
    toast(`Dictamen guardado · ${diagnostico}`, 'ok')
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-headline-xl text-ink">Diagnóstico</h1>
      {esBusqueda ? (
        <div className="flex flex-col gap-3">
          <FormField
            label="Serial"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                navigate(`/pda/diagnostico/${normalizeSerial(q) || 'CIB-00000000'}`)
              }
            }}
            className="font-code-serial"
            placeholder="CIB-…"
          />
          <Button
            className="h-12 w-full text-label-lg"
            onClick={() => navigate(`/pda/diagnostico/${normalizeSerial(q) || 'CIB-00000000'}`)}
          >
            Abrir diagnóstico
          </Button>
        </div>
      ) : (
        <>
          <div className="surface flex flex-wrap items-center justify-between gap-2 p-3.5">
            <span className="text-headline-md tabular-nums text-viamar-600">{serial}</span>
            {bateria ? (
              <StatusBadge catalogId={bateria.diagnosticoId} size="md" />
            ) : (
              <Pill tone="danger">No encontrado</Pill>
            )}
          </div>

          {/* Dictamen: tres destinos posibles y ninguno es el habitual, así que
              los tres pesan igual y ninguno se presenta como primario. El color
              anticipa a dónde va la batería, no jerarquiza la opción. */}
          <div className="flex flex-col gap-3">
            {DICTAMENES.map((d) => {
              const Icon = d.icon
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={!bateria}
                  onClick={() => dictaminar(d.id)}
                  className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-4 text-left shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-0.5 hover:border-viamar-200 hover:shadow-md active:bg-surface-active disabled:pointer-events-none disabled:opacity-50"
                >
                  <span
                    className={cn(
                      'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                      d.tint,
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={24} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-headline-sm text-ink">{d.label}</span>
                    <span className="block text-body-xs text-ink-tertiary">{d.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <Link
            to={`/serial/${serial}`}
            className="text-label-lg text-viamar-600 underline-offset-2 hover:underline"
          >
            Abrir ficha del serial
          </Link>
        </>
      )}
    </div>
  )
}

export function PdaResumenPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.usuarioActual)
  const baterias = useBatteryStore((s) => s.baterias)
  const dealers = useDistributorStore((s) => s.dealers)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const load = useInspectionStore((s) => s.load)
  const toast = useUiStore((s) => s.pushToast)
  const [visit, setVisit] = useState(() => loadPdaVisit(dealers[0]?.id ?? ''))

  const esperado = useMemo(
    () =>
      Object.values(baterias)
        .filter((b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === visit.dealerId)
        .map((b) => b.serial)
        .sort(),
    [baterias, visit.dealerId],
  )
  const faltantes = esperado.filter((s) => !visit.seen.includes(s))
  const sobrantes = visit.seen.filter((s) => !esperado.includes(s))
  const dealerNombre = dealers.find((d) => d.id === visit.dealerId)?.nombre ?? visit.dealerId

  function cerrarVisita() {
    if (visit.seen.length === 0) {
      toast('Conteo vacío: registre al menos un serial', 'warn')
      return
    }
    const usados = new Set(solicitudes.map((s) => s.numero))
    let n = solicitudes.length + 1
    while (usados.has(`SCH-2026-${String(n).padStart(3, '0')}`)) n += 1
    const numero = `SCH-2026-${String(n).padStart(3, '0')}`
    const now = new Date()
    const lineas: LineaDiagnostico[] = visit.seen.map((s, i) => {
      const b = baterias[s]
      const diagnostico = visit.diagnosticos[s] ?? b?.diagnosticoId ?? 'PENDIENTE'
      return {
        id: `lin-pda-${Date.now()}-${i}`,
        serial: s,
        voltaje: 12.6,
        densidad: 1.27,
        capacidadMedida: 80,
        diagnostico,
        accionSugerida: DIAG_ACCION[diagnostico] ?? 'Sin acción',
      }
    })
    const nueva = {
      id: `sch-pda-${Date.now()}`,
      numero,
      dealerId: visit.dealerId,
      vendedorId: user?.id ?? 'sistema',
      supervisorId: 'usr-elizabeth',
      estado: 'PENDIENTE' as const,
      fechaCreacion: iso(now),
      fechaVisita: iso(now),
      centroId: 'centro-sd',
      lineas,
    }
    load([...solicitudes, nueva])
    for (const l of lineas) {
      withHistory(l.serial, 'CHEQUEO', `Chequeo PDA ${numero} · ${l.diagnostico}`, () => undefined, {
        estadoNuevo: l.diagnostico,
        referenciaId: nueva.id,
      })
    }
    clearPdaVisit(visit.dealerId)
    setVisit({ dealerId: visit.dealerId, seen: [], diagnosticos: {} })
    toast(`Visita cerrada · ${numero} con ${lineas.length} líneas`, 'ok')
    navigate('/gestion-tecnica')
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-headline-xl text-ink">Cierre de visita</h1>
        <p className="mt-1 text-body-sm text-ink-secondary">{dealerNombre}</p>
      </header>

      {/* Recuento de lo que se va a enviar: la última oportunidad de ver un
          faltante antes de que la visita quede cerrada. */}
      <section className="rounded-xl border border-line bg-white p-4 shadow-xs">
        <ProgressBar done={visit.seen.length} total={esperado.length} />
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <Resumen label="Contados" value={`${visit.seen.length} / ${esperado.length}`} />
          <Resumen label="Diagnosticados" value={Object.keys(visit.diagnosticos).length} />
          <Resumen label="Faltantes" value={faltantes.length} tone={faltantes.length ? 'warn' : undefined} />
          <Resumen label="Sobrantes" value={sobrantes.length} tone={sobrantes.length ? 'danger' : undefined} />
        </dl>
      </section>

      <Button className="h-14 w-full text-label-lg" onClick={cerrarVisita}>
        Cerrar visita y generar chequeo
      </Button>
      <p className="text-body-sm text-ink-secondary">
        Genera la solicitud de chequeo en gestión técnica con las líneas contadas y diagnosticadas.
      </p>
    </div>
  )
}

/** Cifra del cierre. El color sólo aparece cuando hay una discrepancia. */
function Resumen({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: 'warn' | 'danger'
}) {
  return (
    <div>
      <dt className="text-body-xs text-ink-tertiary">{label}</dt>
      <dd
        className={cn(
          'text-metric tabular-nums',
          tone === 'warn' ? 'text-warning-text' : tone === 'danger' ? 'text-critical-text' : 'text-ink',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
