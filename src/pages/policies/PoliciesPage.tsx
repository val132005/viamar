import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { CoverageChart } from '../../components/ui/CoverageChart'
import { FormulaEditor } from '../../components/ui/FormulaEditor'
import { SimulatorPanel } from '../../components/ui/SimulatorPanel'
import { usd } from '../../domain/money'
import { validateFormula } from '../../domain/warranty/formula'
import { PRESET_FDD489, PRESET_FRD489 } from '../../domain/warranty/presets'
import { comparePresets } from '../../domain/warranty/simulate'
import { useConfigStore } from '../../stores/configStore'
import { useUiStore } from '../../stores/uiStore'
import { useWarrantyStore } from '../../stores/warrantyStore'

export function PoliciesPage() {
  const politicas = useConfigStore((s) => s.politicas)
  const formulas = useConfigStore((s) => s.formulas)
  const guardarVersion = useConfigStore((s) => s.guardarVersion)
  const honras = useWarrantyStore((s) => s.honras)
  const toast = useUiStore((s) => s.pushToast)
  const activas = useMemo(() => politicas.filter((p) => p.estado === 'ACTIVA'), [politicas])
  const [politicaKey, setPoliticaKey] = useState(`${activas[0]?.id}::${activas[0]?.version ?? 1}`)
  const politica = politicas.find((p) => `${p.id}::${p.version}` === politicaKey) ?? activas[0]
  const stored = formulas.find((f) => f.id === politica?.formulaId)
  const [formula, setFormula] = useState(stored?.expresion ?? PRESET_FDD489)
  const error = validateFormula(formula)
  const honrasCongeladas = honras.filter(
    (h) => h.politicaId === politica?.id && h.politicaVersion === politica?.version,
  ).length

  const comparacion = politica
    ? comparePresets(politica, {
        mesesUso: 14,
        precioOriginal: 180,
        precioVigente: 180,
        capacidadMedida: 80,
      })
    : null

  function onSave() {
    if (!politica || error) {
      toast(error ?? 'Sin política', 'warn')
      return
    }
    const res = guardarVersion(politica.id, formula)
    if ('error' in res) {
      toast(res.error, 'error')
      return
    }
    setPoliticaKey(`${politica.id}::${res.version}`)
    toast(`Nueva versión v${res.version}. Las honras ya ejecutadas no cambian.`, 'ok')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-headline-lg text-viamar-800">Políticas y fórmulas</h1>
          <p className="text-body-sm text-ink-secondary">
            La fórmula vigente es la del <strong className="text-viamar-800">FDD 489</strong>: responde
            el monto que Viamar acredita. El FRD 489 queda como contraste. El motor no usa eval.
          </p>
        </div>
        <Link to="/configuracion/casos-prueba" className="text-label-md text-viamar-700 hover:text-viamar-link-hover">
          Casos de prueba
        </Link>
      </div>

      <label className="text-label-md flex flex-col gap-1 max-w-md">
        Política
        <select
          className="h-10 px-3 rounded border border-app-border-strong bg-white"
          value={politica ? `${politica.id}::${politica.version}` : ''}
          onChange={(e) => {
            setPoliticaKey(e.target.value)
            const next = politicas.find((p) => `${p.id}::${p.version}` === e.target.value)
            const f = formulas.find((x) => x.id === next?.formulaId)
            if (f) setFormula(f.expresion)
          }}
        >
          {politicas.map((p) => (
            <option key={`${p.id}-${p.version}`} value={`${p.id}::${p.version}`}>
              {p.nombre} v{p.version} ({p.estado})
            </option>
          ))}
        </select>
      </label>

      {comparacion ? (
        <div className="grid md:grid-cols-2 gap-3">
          <PresetCard
            title="FDD 489"
            badge="Vigente"
            hint="La fórmula responde el monto a acreditar"
            primaryLabel="Acredita Viamar"
            primary={comparacion.fdd.montoAcreditar}
            secondary={`Cliente paga ${usd(comparacion.fdd.montoCliente)}`}
            vigencia={comparacion.fdd.decisionVigencia}
            onApply={() => setFormula(PRESET_FDD489)}
          />
          <PresetCard
            title="FRD 489"
            badge="Contraste"
            hint="La fórmula responde lo que paga el cliente"
            primaryLabel="Paga el cliente"
            primary={comparacion.frd.montoCliente}
            secondary={`Viamar acredita ${usd(comparacion.frd.montoAcreditar)}`}
            vigencia={comparacion.frd.decisionVigencia}
            onApply={() => setFormula(PRESET_FRD489)}
          />
        </div>
      ) : null}
      {comparacion ? (
        <p className="text-body-sm text-viamar-800 bg-viamar-50 rounded px-3 py-2">
          Mismo caso (14 meses, USD 180): FDD responde {usd(comparacion.fdd.montoAcreditar)} (acreditar)
          y FRD responde {usd(comparacion.frd.montoCliente)} (paga el cliente). Son salidas distintas
          del mismo insumo — no se elige por el cliente. <strong>Viamar opera con el FDD 489</strong>;
          el FRD se conserva para poder contrastar la cifra ante una discusión.
        </p>
      ) : null}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-4">
        <div className="bg-white border border-app-border rounded p-4 flex flex-col gap-2">
          <FormulaEditor value={formula} onChange={setFormula} />
          {error ? (
            <p className="text-body-sm text-danger">{error}</p>
          ) : (
            <p className="text-body-sm text-ok">Expresión válida</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onSave} disabled={!!error || !politica}>
              Guardar como versión nueva
            </Button>
            <p className="text-body-sm text-ink-secondary">
              {honrasCongeladas} honra{honrasCongeladas === 1 ? '' : 's'} congelada
              {honrasCongeladas === 1 ? '' : 's'} en v{politica?.version}. No se recalculan.
            </p>
          </div>
        </div>
        <SimulatorPanel formula={formula} politica={politica} />
      </div>
      {politica ? (
        <CoverageChart mesesFull={politica.mesesFull} mesesProrrateo={politica.mesesProrrateo} />
      ) : null}
    </div>
  )
}

function PresetCard({
  title,
  badge,
  hint,
  primaryLabel,
  primary,
  secondary,
  vigencia,
  onApply,
}: {
  title: string
  badge: 'Vigente' | 'Contraste'
  hint: string
  primaryLabel: string
  primary: number
  secondary: string
  vigencia: string
  onApply: () => void
}) {
  const vigente = badge === 'Vigente'
  return (
    <article
      className={
        vigente
          ? 'bg-white border-2 border-viamar-500 rounded p-4 flex flex-col gap-2'
          : 'bg-white border border-app-border rounded p-4 flex flex-col gap-2'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-headline-sm">{title}</h2>
            <span
              className={
                vigente
                  ? 'rounded bg-viamar-500 px-2 py-0.5 text-label-sm font-semibold text-white'
                  : 'rounded bg-app-surface-alt px-2 py-0.5 text-label-sm text-ink-secondary'
              }
            >
              {badge}
            </span>
          </div>
          <p className="text-body-sm text-ink-secondary">{hint}</p>
        </div>
        <Button variant="outlined" className="h-8 text-label-md" onClick={onApply}>
          Usar
        </Button>
      </div>
      <p className="text-label-sm uppercase text-ink-secondary">{primaryLabel}</p>
      <p className="text-headline-lg text-viamar-700">{usd(primary)}</p>
      <p className="text-body-sm text-ink-secondary">{secondary}</p>
      <p className="text-label-sm uppercase text-viamar-800">Vigencia {vigencia}</p>
    </article>
  )
}
