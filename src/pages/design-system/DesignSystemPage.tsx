import { useState, type ReactNode } from 'react'
import { BadgeCheck, Clock, Plus, ScanBarcode, ShieldAlert, Warehouse } from 'lucide-react'
import { ViamarLogo } from '../../components/brand/ViamarLogo'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { MetricCard } from '../../components/ui/MetricCard'
import { Modal } from '../../components/ui/Modal'
import { PageTabs } from '../../components/ui/PageTabs'
import { Pill } from '../../components/ui/Pill'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { MetricGrid } from '../../components/ui/Workspace'
import { DonaEstado, PanelHeader, Ranking } from '../../components/panel/PanelWidgets'
import { PANEL, TONO_HEX, type Tono } from '../../components/panel/tonos'
import { CERTIFICADO_CATALOG, DIAGNOSTICO_CATALOG } from '../../domain/catalogs'
import { cn } from '../../lib/cn'
import { useUiStore } from '../../stores/uiStore'

/* Los valores de esta página son los mismos tokens que usa la aplicación:
   si cambian en tailwind.config.ts, cambian aquí. */
const SCALE = [
  { token: '50', hex: '#F1F6FB', use: 'Fondo de icono, fila seleccionada' },
  { token: '100', hex: '#E1EBF5', use: 'Círculo de icono de tarjeta' },
  { token: '200', hex: '#C3D8EA', use: 'Borde de chip y tarjeta destacada' },
  { token: '400', hex: '#5892C2', use: 'Cifra de pestaña activa' },
  { token: '500', hex: '#206AA9', use: 'Marca: enlaces, serial, paginación' },
  { token: '600', hex: '#1B5C93', use: 'Pestaña activa, títulos de acento' },
  { token: '700', hex: '#175079', use: 'Texto azul sobre fondo claro' },
  { token: '900', hex: '#0E3453', use: 'Estructural' },
] as const

const SUPERFICIES = [
  { name: 'Menú lateral', hex: '#0B2B4C', dark: true },
  { name: 'Fondo de la app', hex: '#F7F9FC' },
  { name: 'Tarjeta', hex: '#FFFFFF' },
  { name: 'Cabecera de tabla', hex: '#F0F5FA' },
  { name: 'Zona de apoyo', hex: '#F7FAFD' },
  { name: 'Borde', hex: '#E3E8EF' },
  { name: 'Texto', hex: '#17242F', dark: true },
  { name: 'Texto secundario', hex: '#566573', dark: true },
]

const TONOS: Array<{ tono: Tono; uso: string }> = [
  { tono: 'brand', uso: 'Marca, volumen, ranking' },
  { tono: 'accent', uso: 'En curso, heredado' },
  { tono: 'ok', uso: 'Buen estado, vigente, ejecutado' },
  { tono: 'warn', uso: 'Aviso: pizarra azulada, nunca ámbar' },
  { tono: 'danger', uso: 'Garantía, cancelado, rechazo' },
  { tono: 'navy', uso: 'Estructural, dañada' },
  { tono: 'neutral', uso: 'Sin dato, pendiente' },
]

const TYPE_SCALE = [
  { name: 'display', className: 'text-display', sample: 'Trazabilidad de seriales' },
  { name: 'headline-md', className: 'text-headline-md', sample: 'Solicitud de chequeo' },
  { name: 'headline-sm', className: 'text-headline-sm', sample: 'Distribución por ubicación' },
  { name: 'metric-xl', className: 'text-metric-xl tabular-nums', sample: '152' },
  { name: 'body-md', className: 'text-body-md', sample: 'Cuerpo base para descripciones de página.' },
  { name: 'body-sm', className: 'text-body-sm text-ink-secondary', sample: 'Etiqueta de tarjeta y texto de apoyo.' },
  { name: 'label-lg', className: 'text-label-lg', sample: 'Etiqueta de pestaña' },
  { name: 'tabla · Inter', className: 'font-inter text-[11.5px] tracking-[-0.01em]', sample: 'CIB-91000025 · Inventario dealer · 24 ago de 2026' },
]

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <PanelHeader title={<span className="text-headline-md">{title}</span>} className="mb-3" />
      {children}
    </section>
  )
}

export function DesignSystemPage() {
  const [tab, setTab] = useState('todos')
  const [modal, setModal] = useState(false)
  const toast = useUiStore((s) => s.pushToast)
  const ask = useUiStore((s) => s.askConfirm)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-overline uppercase text-viamar-500">Prototipo · sistema de diseño</p>
          <h1 className="mt-1 text-display text-ink">Identidad visual del panel</h1>
          <p className="mt-1 max-w-2xl text-body-md text-ink-secondary">
            La identidad de Dashboard y Trazabilidad, aplicada en toda la aplicación: tarjetas blancas de
            14 px, iconos en círculo, pestañas subrayadas, tabla en Inter y azul de marca sin tonos cálidos.
          </p>
        </div>
      </header>

      <Section id="marca" title="Marca">
        <div className="grid gap-3.5 md:grid-cols-2">
          <div className={cn(PANEL, 'flex flex-col gap-3 p-6')}>
            <ViamarLogo className="h-14 w-auto self-start" />
            <p className="text-body-sm text-ink-secondary">
              Logo oficial trazado a curvas. Sobre fondo claro, con sus colores originales.
            </p>
          </div>
          <div className="brand-canvas flex flex-col gap-3 rounded-xl p-6">
            <ViamarLogo className="logo-negativo h-14 w-auto self-start" />
            <p className="text-body-sm text-white/70">
              Sobre el marino del menú: letras blancas, esfera con su degradado y sombra corta. Sin placa blanca.
            </p>
          </div>
        </div>
      </Section>

      <Section id="color" title="Color">
        <div className="mb-3.5 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {SCALE.map((s) => (
            <div key={s.token} className={cn(PANEL, 'overflow-hidden')} title={s.use}>
              <div className="h-14" style={{ background: s.hex }} />
              <div className="p-2">
                <p className="text-label-sm text-ink">viamar-{s.token}</p>
                <p className="font-inter text-[11px] text-ink-tertiary">{s.hex}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {SUPERFICIES.map((n) => (
            <div key={n.name} className={cn(PANEL, 'overflow-hidden')}>
              <div className="h-12 border-b border-line" style={{ background: n.hex }} />
              <div className="p-2">
                <p className="truncate text-label-sm text-ink">{n.name}</p>
                <p className="font-inter text-[11px] text-ink-tertiary">{n.hex}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={cn(PANEL, 'grid gap-x-6 gap-y-2 p-4 sm:grid-cols-2 lg:grid-cols-4')}>
          {TONOS.map((t) => (
            <div key={t.tono} className="flex items-center gap-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: TONO_HEX[t.tono] }} />
              <span className="text-label-lg text-ink">{t.tono}</span>
              <span className="truncate text-body-xs text-ink-tertiary">{t.uso}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tipografia" title="Tipografía">
        <div className={cn(PANEL, 'divide-y divide-line-subtle')}>
          {TYPE_SCALE.map((t) => (
            <div key={t.name} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-baseline">
              <code className="w-32 shrink-0 text-label-sm text-viamar-600">{t.name}</code>
              <p className={cn('text-ink', t.className)}>{t.sample}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-body-sm text-ink-secondary">
          Open Sans en la interfaz; Inter en las tablas de registros, como en la maqueta aprobada.
        </p>
      </Section>

      <Section id="tarjetas" title="Tarjetas de resumen">
        <MetricGrid columns={4}>
          <MetricCard label="Seriales visibles" value={152} icon={ScanBarcode} tone="brand" trend={[4, 6, 5, 9, 12, 10]} change={{ direccion: 'sube', label: '+37.5%', pct: 37.5 }} />
          <MetricCard label="En dealer" value={60} icon={Warehouse} tone="neutral" context="39% del parque" />
          <MetricCard label="Vigentes" value={18} icon={BadgeCheck} tone="ok" filled context="78% del total emitido" />
          <MetricCard label="Para garantía" value={8} icon={ShieldAlert} tone="danger" context="5% del parque" />
        </MetricGrid>
      </Section>

      <Section id="bloques" title="Bloques analíticos">
        <div className="grid gap-3.5 lg:grid-cols-[45fr_55fr]">
          <section className={cn(PANEL, 'min-w-0 px-4 pb-4 pt-3.5')}>
            <PanelHeader title="Diagnóstico del parque" info="Anillo con leyenda en columnas." />
            <div className="mt-3">
              <DonaEstado
                unidad="seriales"
                segmentos={[
                  { id: 'a', label: 'Buen estado', valor: 129, tono: 'ok' },
                  { id: 'b', label: 'Descargada', valor: 15, tono: 'warn' },
                  { id: 'c', label: 'Para garantía', valor: 8, tono: 'danger' },
                ]}
              />
            </div>
          </section>
          <section className={cn(PANEL, 'min-w-0 px-4 pb-3 pt-3.5')}>
            <PanelHeader title="Ranking" info="Barra proporcional al primero y peso en porcentaje." />
            <div className="mt-1.5">
              <Ranking
                total={60}
                filas={[
                  { id: '1', label: 'Baterías y Servicios Ozama SRL', valor: 14 },
                  { id: '2', label: 'Auto Repuestos El Caribe SRL', valor: 10 },
                  { id: '3', label: 'Centro Automotriz Cibao SA', valor: 8 },
                  { id: '4', label: 'Repuestos La Vega Real SRL', valor: 7 },
                ]}
              />
            </div>
          </section>
        </div>
      </Section>

      <Section id="estados" title="Estados y etiquetas">
        <div className={cn(PANEL, 'flex flex-col gap-3 p-4')}>
          <div className="flex flex-wrap items-center gap-2">
            {[...DIAGNOSTICO_CATALOG, ...CERTIFICADO_CATALOG].map((c) => (
              <StatusBadge key={c.id} item={c} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="ok" dot>Ejecutada</Pill>
            <Pill tone="info" dot>En proceso</Pill>
            <Pill tone="warn" dot>Pendiente</Pill>
            <Pill tone="danger" dot>Rechazada</Pill>
            <Pill tone="brand">Hereda</Pill>
            <Pill tone="neutral">No aplica</Pill>
          </div>
        </div>
      </Section>

      <Section id="controles" title="Pestañas, botones y campos">
        <div className={cn(PANEL, 'flex flex-col gap-4 p-4')}>
          <PageTabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'todos', label: 'Todos', count: 152 },
              { id: 'dealer', label: 'En dealer', count: 60 },
              { id: 'garantia', label: 'Para garantía', count: 8, tone: 'danger' },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <Button leadingIcon={<Plus size={15} />}>Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="outlined">Contorno</Button>
            <Button variant="danger">Destructivo</Button>
            <Button variant="danger-quiet">Destructivo suave</Button>
          </div>
          <div className="grid max-w-2xl gap-3.5 sm:grid-cols-2">
            <FormField label="Serial" placeholder="CIB-90822173" />
            <FormField label="Capacidad medida (%)" type="number" defaultValue={80} />
          </div>
        </div>
      </Section>

      <Section id="dialogos" title="Diálogos y avisos">
        <div className={cn(PANEL, 'flex flex-wrap items-center gap-2.5 p-4')}>
          <Button variant="secondary" onClick={() => setModal(true)}>
            Abrir diálogo
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              void ask({
                title: 'Confirmar acción',
                message: 'Así se ve la confirmación de una acción destructiva.',
                confirmLabel: 'Confirmar',
                danger: true,
              })
            }
          >
            Confirmación destructiva
          </Button>
          <Button variant="secondary" onClick={() => toast('Operación registrada correctamente', 'ok')}>
            Aviso correcto
          </Button>
          <Button variant="secondary" onClick={() => toast('No se pudo completar la operación', 'error')}>
            Aviso de error
          </Button>
        </div>
      </Section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Diálogo del panel"
        description="Icono en círculo, cierre redondo y pie gris azulado."
        icon={Clock}
        footer={
          <>
            <Button variant="outlined" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModal(false)}>Aceptar</Button>
          </>
        }
      >
        <FormField label="Nota" placeholder="Escribe una nota…" />
      </Modal>
    </div>
  )
}
