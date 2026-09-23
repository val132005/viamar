import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { FormField, SelectField } from '../../components/ui/FormField'
import { StatusBadge } from '../../components/ui/StatusBadge'
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
    <div className="flex flex-col gap-3">
      <h1 className="text-headline-md text-viamar-800">Conteo</h1>
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
      <FormField label="Escanear" value={q} onChange={(e) => setQ(e.target.value)} className="font-code-serial" />
      <Button onClick={add}>Registrar</Button>
      <p className="text-body-sm">
        Contados {visit.seen.length} / esperados {esperado.length}
      </p>
      <p className="text-body-sm text-ink-secondary">
        Faltantes {faltantes.length} · Sobrantes {sobrantes.length}
      </p>
      {faltantes.length > 0 ? (
        <div className="bg-white border border-app-border rounded p-3">
          <p className="text-label-md">Faltantes</p>
          <ul className="text-body-sm font-code-serial">
            {faltantes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {sobrantes.length > 0 ? (
        <div className="bg-white border border-app-border rounded p-3">
          <p className="text-label-md">Sobrantes</p>
          <ul className="text-body-sm font-code-serial">
            {sobrantes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Link to="/pda/resumen" className="text-viamar-700 text-label-md">
        Ir al cierre de visita
      </Link>
    </div>
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
    <div className="flex flex-col gap-3">
      <h1 className="text-headline-md">Diagnóstico</h1>
      {esBusqueda ? (
        <>
          <FormField label="Serial" value={q} onChange={(e) => setQ(e.target.value)} className="font-code-serial" />
          <Button onClick={() => navigate(`/pda/diagnostico/${normalizeSerial(q) || 'CIB-00000000'}`)}>
            Abrir diagnóstico
          </Button>
        </>
      ) : (
        <>
          <p className="font-code-serial text-viamar-700">{serial}</p>
          {bateria ? <StatusBadge catalogId={bateria.diagnosticoId} /> : <p>No encontrado</p>}
          <Button className="h-14 text-label-lg" variant="outlined" onClick={() => dictaminar('BUEN_ESTADO')}>
            Buen estado
          </Button>
          <Button className="h-14 text-label-lg" variant="outlined" onClick={() => dictaminar('DESCARGADA')}>
            Descargada · enviar a carga
          </Button>
          <Button className="h-14 text-label-lg" variant="outlined" onClick={() => dictaminar('PARA_GARANTIA')}>
            Para garantía
          </Button>
          <Link to={`/serial/${serial}`} className="text-viamar-700 text-label-md">
            Abrir ficha
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
    <div className="flex flex-col gap-3">
      <h1 className="text-headline-md">Cierre de visita</h1>
      <p className="text-body-sm text-ink-secondary">
        {dealerNombre} · contados {visit.seen.length}/{esperado.length} · faltantes {faltantes.length} ·
        sobrantes {sobrantes.length} · diagnosticados {Object.keys(visit.diagnosticos).length}
      </p>
      <Button className="h-14 text-label-lg" onClick={cerrarVisita}>
        Cerrar visita y generar chequeo
      </Button>
      <p className="text-body-sm text-ink-secondary">
        Genera la solicitud de chequeo en gestión técnica con las líneas contadas y diagnosticadas.
      </p>
    </div>
  )
}
