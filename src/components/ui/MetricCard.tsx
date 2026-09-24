import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Variacion } from '../../domain/analytics'
import { cn } from '../../lib/cn'
import { Sparkline } from './charts/Sparkline'

export type MetricTone = 'brand' | 'ok' | 'warn' | 'danger' | 'accent' | 'neutral'

/* Cuadro del icono: fondo tintado del rol semántico, contorno interno tenue.
   Es el ancla visual de la tarjeta y lo primero que identifica la métrica. */
const ICON_BOX: Record<MetricTone, string> = {
  brand: 'bg-viamar-50 text-viamar-600 ring-viamar-100',
  ok: 'bg-success-soft text-success ring-success-border/60',
  warn: 'bg-warning-soft text-warning ring-warning-border/60',
  danger: 'bg-critical-soft text-critical ring-critical-border/60',
  accent: 'bg-info-soft text-info ring-info-border/60',
  neutral: 'bg-neutral-100 text-ink-secondary ring-neutral-200',
}

/* Tarjeta en alerta: se tiñe entera para que salte por encima de las demás
   sin necesidad de un icono de aviso adicional. */
const SHELL: Record<MetricTone, string> = {
  brand: 'bg-white border-line',
  ok: 'bg-white border-line',
  warn: 'bg-white border-line',
  danger: 'bg-critical-soft/40 border-critical-border',
  accent: 'bg-white border-line',
  neutral: 'bg-white border-line',
}

/* Variante tintada: la tarjeta adopta el color de su rol. Sirve para que una
   fila de métricas se lea como un semáforo de un vistazo, sin tener que leer
   cada etiqueta. Se reserva para grupos donde el rol es la información —cola,
   capacidad, aprobado, rechazado—, no para adornar un panel cualquiera. */
const SHELL_FILLED: Record<MetricTone, string> = {
  brand: 'bg-viamar-50/70 border-viamar-200',
  ok: 'bg-success-soft/60 border-success-border',
  warn: 'bg-warning-soft/60 border-warning-border',
  danger: 'bg-critical-soft/60 border-critical-border',
  accent: 'bg-info-soft/60 border-info-border',
  neutral: 'bg-neutral-50 border-line',
}

const VALOR: Record<MetricTone, string> = {
  brand: 'text-ink',
  ok: 'text-ink',
  warn: 'text-ink',
  danger: 'text-critical-text',
  accent: 'text-ink',
  neutral: 'text-ink',
}

const ETIQUETA: Record<MetricTone, string> = {
  brand: 'text-ink-secondary',
  ok: 'text-ink-secondary',
  warn: 'text-ink-secondary',
  danger: 'text-critical-text',
  accent: 'text-ink-secondary',
  neutral: 'text-ink-secondary',
}

type Props = {
  label: string
  value: ReactNode
  /** Nota corta junto a la cifra: desglose, objetivo o unidad. */
  note?: ReactNode
  /** Variación contra el período anterior. `null` = sin base comparable. */
  change?: Variacion | null
  /** Contexto de la variación: `vs. mes anterior`. */
  changeLabel?: ReactNode
  /** Si subir es favorable. Decide el color, no la dirección de la flecha. */
  subirEsBueno?: boolean
  /**
   * Contexto que ocupa el lugar de la variación cuando no hay período
   * anterior con el que comparar. Debe ser un hecho del período actual, no
   * un relleno: es lo que el usuario leerá en su lugar.
   */
  context?: ReactNode
  /** Serie histórica que da silueta a la cifra. */
  trend?: number[]
  /** Tono del trazo, si difiere del de la tarjeta. */
  trendTone?: MetricTone
  icon: LucideIcon
  tone?: MetricTone
  /**
   * Tiñe la tarjeta entera con el color del rol. Úsalo cuando el estado sea el
   * dato (cola, disponible, rechazado) y no un matiz de una cifra neutra.
   */
  filled?: boolean
  to?: string
  className?: string
}

/**
 * Métrica principal del panel.
 *
 * Tres capas de lectura en un solo golpe de vista: el icono dice de qué
 * hablamos, la cifra dice cuánto, y la curva dice hacia dónde va. La variación
 * queda abajo porque responde a «¿debo preocuparme?», que es una pregunta
 * posterior a «¿cuánto hay?».
 */
export function MetricCard({
  label,
  value,
  note,
  change,
  changeLabel,
  subirEsBueno = true,
  context,
  trend,
  trendTone,
  icon: Icon,
  tone = 'brand',
  filled = false,
  to,
  className,
}: Props) {
  /* Una serie sin relieve (toda a cero o constante) no es una tendencia:
     dibujarla sólo añadiría una raya que el usuario tiene que descartar. */
  const hayTendencia = Boolean(
    trend && trend.length > 1 && trend.some((v) => v !== trend[0]) && trend.some((v) => v !== 0),
  )
  const cambioBueno =
    change && change.direccion !== 'igual' ? (change.direccion === 'sube') === subirEsBueno : null

  const cuerpo = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
            /* Sobre una tarjeta tintada el cuadro se aclara: si conservara el
               mismo tinte que el fondo, el icono se disolvería en él. */
            filled ? cn(ICON_BOX[tone], 'bg-white/80') : ICON_BOX[tone],
          )}
          aria-hidden="true"
        >
          <Icon size={20} strokeWidth={1.9} />
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-body-sm', ETIQUETA[tone])}>{label}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className={cn('text-metric-xl leading-none tabular-nums', VALOR[tone])}>
              {value}
            </span>
            {note ? (
              <span className="min-w-0 truncate text-label-md text-ink-tertiary">{note}</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Pie de la tarjeta: la variación a la izquierda, la curva a la derecha,
          compartiendo línea base para que la tarjeta no crezca de alto. */}
      <div className="mt-3 flex items-end justify-between gap-3">
        {/* El pie va en un bloque propio: el recorte sólo funciona sobre un
            elemento de bloque, y sin él la etiqueta larga invade la curva. */}
        <div className="min-w-0 flex-1">
          {change ? (
            <p className="truncate text-body-xs text-ink-tertiary">
              <span
                className={cn(
                  'text-label-lg tabular-nums',
                  cambioBueno === null
                    ? 'text-ink-tertiary'
                    : cambioBueno
                      ? 'text-success'
                      : 'text-critical',
                )}
              >
                {change.label}
              </span>
              {changeLabel ? <span className="ml-1.5">{changeLabel}</span> : null}
            </p>
          ) : context ? (
            <p className="truncate text-body-xs text-ink-tertiary">{context}</p>
          ) : null}
        </div>

        {hayTendencia ? (
          <Sparkline
            data={trend!}
            tone={trendTone ?? tone}
            width={132}
            height={46}
            strokeWidth={2}
            className="-mb-1 hidden shrink-0 sm:block"
          />
        ) : null}
      </div>
    </>
  )

  const shell = cn(
    'block rounded-xl border p-4 text-left',
    filled ? SHELL_FILLED[tone] : SHELL[tone],
    to &&
      'transition-[border-color,box-shadow] duration-fast ease-brand hover:border-viamar-200 hover:shadow-sm focus-visible:shadow-focus',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={shell}>
        {cuerpo}
      </Link>
    )
  }
  return <article className={shell}>{cuerpo}</article>
}
