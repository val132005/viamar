import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  CircleAlert,
  CircleCheck,
  FileCode2,
  FlaskConical,
  Info,
  Scale,
  ShieldCheck,
  Snowflake,
} from 'lucide-react'
import { SelectPill } from '../../components/panel/PanelWidgets'
import { MetricCard } from '../../components/ui/MetricCard'
import { SectionCard } from '../../components/ui/SectionCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { Button } from '../../components/ui/Button'
import { CoverageChart } from '../../components/ui/CoverageChart'
import { FormulaEditor } from '../../components/ui/FormulaEditor'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pill } from '../../components/ui/Pill'
import { SimulatorPanel } from '../../components/ui/SimulatorPanel'
import { cn } from '../../lib/cn'
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
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Políticas y fórmulas"
        description="La fórmula vigente es la del FDD 489: responde el monto que Viamar acredita. El FRD 489 queda como contraste. El motor no usa eval."
        chips={
          politica ? (
            <Pill tone={politica.estado === 'ACTIVA' ? 'ok' : 'neutral'} dot>
              {politica.estado === 'ACTIVA' ? `Vigente · v${politica.version}` : politica.estado}
            </Pill>
          ) : null
        }
        actions={
          <>
            {/* El selector gobierna todo lo que hay debajo: va en la cabecera,
                junto al título, como el filtro de período del panel. */}
            <SelectPill
              value={politica ? `${politica.id}::${politica.version}` : ''}
              ariaLabel="Política"
              className="min-w-[300px]"
              onChange={(v) => {
                setPoliticaKey(v)
                const next = politicas.find((p) => `${p.id}::${p.version}` === v)
                const f = formulas.find((x) => x.id === next?.formulaId)
                if (f) setFormula(f.expresion)
              }}
              options={politicas.map((p) => ({
                value: `${p.id}::${p.version}`,
                label: `${p.nombre} v${p.version} (${p.estado})`,
              }))}
            />
            <Link to="/configuracion/casos-prueba">
              <Button variant="secondary" leadingIcon={<FlaskConical size={15} />}>
                Casos de prueba
              </Button>
            </Link>
          </>
        }
      />

      {politica ? (
        <MetricGrid columns={4}>
          <MetricCard
            label="Política seleccionada"
            value={`v${politica.version}`}
            icon={ShieldCheck}
            tone={politica.estado === 'ACTIVA' ? 'ok' : 'neutral'}
            filled={politica.estado === 'ACTIVA'}
            context={politica.nombre}
          />
          <MetricCard
            label="Cobertura completa"
            value={politica.mesesFull}
            note="meses"
            icon={CalendarClock}
            tone="brand"
            context="El cliente no paga en este tramo"
          />
          <MetricCard
            label="Fin del prorrateo"
            value={politica.mesesProrrateo}
            note="meses"
            icon={Scale}
            tone="accent"
            context="Desde ahí la honra no es admisible"
          />
          <MetricCard
            label="Honras congeladas"
            value={honrasCongeladas}
            icon={Snowflake}
            tone="neutral"
            context={`Calculadas con v${politica.version}; no se recalculan`}
          />
        </MetricGrid>
      ) : null}

      {comparacion ? (
        <div className="grid gap-3.5 md:grid-cols-2">
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
        <aside className="flex items-center gap-3 rounded-xl border border-info-border/70 bg-gradient-to-br from-white to-info-soft/70 px-4 py-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
            <Info size={16} aria-hidden="true" />
          </span>
          <p className="text-body-sm text-info-text">
            Mismo caso (14 meses, USD 180): FDD responde {usd(comparacion.fdd.montoAcreditar)}{' '}
            (acreditar) y FRD responde {usd(comparacion.frd.montoCliente)} (paga el cliente). Son
            salidas distintas del mismo insumo — no se elige por el cliente.{' '}
            <strong className="font-semibold">Viamar opera con el FDD 489</strong>; el FRD se
            conserva para poder contrastar la cifra ante una discusión.
          </p>
        </aside>
      ) : null}

      <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SectionCard
          title="Editor de fórmula"
          description="Evaluador propio, sin eval: sólo se aceptan las variables de la lista."
          icon={<FileCode2 />}
          bodyClassName="flex flex-col gap-3"
        >
          <FormulaEditor value={formula} onChange={setFormula} />

          {/* El veredicto de la expresión va pegado al editor y con el color
              del rol: es la respuesta a lo que el usuario acaba de escribir. */}
          <p
            className={cn(
              'inline-flex items-center gap-1.5 text-body-sm',
              error ? 'text-critical-text' : 'text-success-text',
            )}
          >
            {error ? <CircleAlert size={14} /> : <CircleCheck size={14} />}
            {error ?? 'Expresión válida'}
          </p>

          <div className="flex flex-wrap items-center gap-3 border-t border-line-subtle pt-3">
            <Button onClick={onSave} disabled={!!error || !politica}>
              Guardar como versión nueva
            </Button>
            <p className="text-body-sm text-ink-secondary">
              {honrasCongeladas} honra{honrasCongeladas === 1 ? '' : 's'} congelada
              {honrasCongeladas === 1 ? '' : 's'} en v{politica?.version}. No se recalculan.
            </p>
          </div>
        </SectionCard>
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
    /* La vigente se distingue por el tinte y el borde de marca, no por un
       grosor mayor: dos tarjetas de distinto grosor descuadran la fila. */
    <article
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-4 shadow-xs transition-[box-shadow,transform] duration-200 ease-brand hover:-translate-y-0.5 hover:shadow-md',
        vigente ? 'border-viamar-200 bg-gradient-to-br from-white to-viamar-50' : 'border-line bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            vigente ? 'bg-viamar-100/80 text-viamar-600' : 'bg-neutral-100 text-ink',
          )}
          aria-hidden="true"
        >
          <FileCode2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-headline-md text-ink">{title}</h2>
            <Pill tone={vigente ? 'brand' : 'neutral'}>{badge}</Pill>
          </div>
          <p className="mt-0.5 text-body-sm text-ink-secondary">{hint}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onApply}>
          Usar
        </Button>
      </div>

      <div className="mt-1 pl-[58px]">
        <p className="text-body-xs text-ink-tertiary">{primaryLabel}</p>
        <p className="text-metric-lg tabular-nums text-ink">{usd(primary)}</p>
        <p className="mt-0.5 text-body-sm text-ink-secondary">{secondary}</p>
      </div>

      <p className="mt-auto pl-[58px] pt-1 text-label-md text-ink-tertiary">Vigencia {vigencia}</p>
    </article>
  )
}
