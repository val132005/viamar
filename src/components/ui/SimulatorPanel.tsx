import { useMemo, useState } from 'react'
import type { Formula, PoliticaGarantia } from '../../domain/entities'
import { usd } from '../../domain/money'
import { STAR_SERIAL } from '../../domain/entities'
import { mesesCalendarioEnteros, parseIso } from '../../domain/warranty/months'
import { simulatePolicy } from '../../domain/warranty/simulate'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { Calculator } from 'lucide-react'
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
    <aside className="surface flex flex-col gap-3 px-4 pb-4 pt-3.5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-viamar-50 text-viamar-600">
          <Calculator size={15} aria-hidden="true" />
        </span>
        <h3 className="text-headline-sm text-ink">Simulador</h3>
      </div>
      <label className="flex flex-col gap-1.5 text-label-md text-ink-secondary">
        Serial del seed (opcional)
        <select
          className="h-9 cursor-pointer rounded-[6px] border border-[#d9e2ec] bg-white px-3 text-body-sm text-ink transition-[border-color,box-shadow] duration-fast hover:border-viamar-300 focus:border-viamar-400 focus:shadow-focus focus:outline-none"
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
        <div className="grid grid-cols-2 gap-2 border-t border-line-subtle pt-3">
          {[
            { l: 'Admisible', v: result.admisible ? 'Sí' : result.motivoRechazo, ok: result.admisible },
            { l: 'Vigencia', v: result.decisionVigencia },
            { l: 'Acredita', v: usd(result.montoAcreditar) },
            { l: 'Paga el cliente', v: usd(result.montoCliente) },
          ].map((d) => (
            <div key={d.l} className="rounded-lg border border-[#e6edf5] bg-[#f7fafd] px-3 py-2">
              <p className="text-body-xs text-ink-tertiary">{d.l}</p>
              <p
                className={
                  d.ok === false
                    ? 'truncate text-label-lg text-critical-text'
                    : d.ok
                      ? 'truncate text-label-lg text-success-text'
                      : 'truncate text-label-lg tabular-nums text-ink'
                }
              >
                {d.v}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-body-sm text-ink-secondary">Seleccione una política para simular.</p>
      )}
    </aside>
  )
}
