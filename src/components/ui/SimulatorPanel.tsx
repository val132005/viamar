import { useMemo, useState } from 'react'
import type { Formula, PoliticaGarantia } from '../../domain/entities'
import { usd } from '../../domain/money'
import { STAR_SERIAL } from '../../domain/entities'
import { mesesCalendarioEnteros, parseIso } from '../../domain/warranty/months'
import { simulatePolicy } from '../../domain/warranty/simulate'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { FormField } from './FormField'

type Props = {
  formula: string
  politica?: PoliticaGarantia
}

export function SimulatorPanel({ formula, politica }: Props) {
  const [mesesUso, setMesesUso] = useState('14')
  const [precio, setPrecio] = useState('180')
  const [precioVigente, setPrecioVigente] = useState('180')
  const [capacidad, setCapacidad] = useState('80')
  const [serialPick, setSerialPick] = useState('')
  const baterias = useBatteryStore((s) => s.baterias)
  const articulos = useBatteryStore((s) => s.articulos)
  const certificados = useCertificateStore((s) => s.certificados)

  const seriales = useMemo(() => {
    const keys = Object.keys(baterias)
    return keys.includes(STAR_SERIAL) ? [STAR_SERIAL, ...keys.filter((k) => k !== STAR_SERIAL).slice(0, 12)] : keys.slice(0, 12)
  }, [baterias])

  function applySerial(serial: string) {
    setSerialPick(serial)
    const b = baterias[serial]
    if (!b) return
    const art = articulos.find((a) => a.id === b.articuloId)
    const cert = certificados.filter((c) => c.serial === serial).slice(-1)[0]
    if (art) {
      setPrecio(String(art.precioVigente))
      setPrecioVigente(String(art.precioVigente))
    }
    if (cert) {
      const meses = mesesCalendarioEnteros(parseIso(cert.fechaVenta), new Date())
      setMesesUso(String(meses))
    }
  }

  const meses = Number(mesesUso) || 0
  const precioN = Number(precio) || 0
  const vigenteN = Number(precioVigente) || 0
  const cap = Number(capacidad) || 0
  const preset: Formula['preset'] =
    formula.includes('mesesUso <= mesesFull ? 0') ? 'FRD489' : formula.includes('precioBase -') ? 'FDD489' : 'custom'

  const result = useMemo(() => {
    if (!politica) return null
    try {
      return simulatePolicy(politica, formula, preset, {
        mesesUso: meses,
        precioOriginal: precioN,
        precioVigente: vigenteN,
        capacidadMedida: cap,
      })
    } catch {
      return null
    }
  }, [formula, politica, meses, precioN, vigenteN, cap, preset])

  return (
    <aside className="surface p-5 flex flex-col gap-3">
      <h3 className="text-headline-sm">Simulador</h3>
      <label className="flex flex-col gap-1 text-label-md">
        Serial del seed (opcional)
        <select
          className="h-10 px-3 rounded-lg border border-app-border-strong bg-white font-code-serial text-[13px] transition-shadow focus:shadow-glow"
          value={serialPick}
          onChange={(e) => applySerial(e.target.value)}
        >
          <option value="">Valores manuales</option>
          {seriales.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <FormField label="Meses de uso" type="number" value={mesesUso} onChange={(e) => setMesesUso(e.target.value)} />
      <FormField label="Precio original (USD)" type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} />
      <FormField
        label="Precio vigente (USD)"
        type="number"
        value={precioVigente}
        onChange={(e) => setPrecioVigente(e.target.value)}
      />
      <FormField
        label="Capacidad medida (%)"
        type="number"
        value={capacidad}
        onChange={(e) => setCapacidad(e.target.value)}
      />
      {result ? (
        <dl className="text-body-sm grid grid-cols-2 gap-2 border-t border-app-border pt-3">
          <dt className="text-ink-secondary">Admisible</dt>
          <dd>{result.admisible ? 'Sí' : result.motivoRechazo}</dd>
          <dt className="text-ink-secondary">Vigencia</dt>
          <dd className="font-semibold">{result.decisionVigencia}</dd>
          <dt className="text-ink-secondary">Acreditar</dt>
          <dd>{usd(result.montoAcreditar)}</dd>
          <dt className="text-ink-secondary">Paga el cliente</dt>
          <dd>{usd(result.montoCliente)}</dd>
        </dl>
      ) : (
        <p className="text-body-sm text-ink-secondary">Seleccione una política para simular.</p>
      )}
    </aside>
  )
}
