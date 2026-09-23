import type { ReactNode } from 'react'
import {
  BatteryCharging,
  CircleAlert,
  CircleCheck,
  OctagonX,
  ScanLine,
  ShieldAlert,
} from 'lucide-react'
import { ViamarLogo } from '../../components/brand/ViamarLogo'

const SCALE = [
  { token: '50', hex: '#F2F6FA', use: 'Fila activa, fondo de badge' },
  { token: '100', hex: '#E0EAF3', use: 'Chip informativo' },
  { token: '200', hex: '#BCD2E5', use: 'Borde de chip azul' },
  { token: '400', hex: '#588FBE', use: 'Hover claro, icono decorativo' },
  { token: '500', hex: '#206AA9', use: 'Marca: botón primario, nav activa' },
  { token: '600', hex: '#1B5C93', use: 'Hover de botón primario' },
  { token: '700', hex: '#185587', use: 'Texto azul sobre fondo claro' },
  { token: '800', hex: '#12436B', use: 'Active, encabezado oscuro' },
  { token: '900', hex: '#0E3453', use: 'Máximo contraste' },
] as const

const NEUTRALS = [
  { name: 'Fondo app', hex: '#F8F8F8' },
  { name: 'Superficie', hex: '#FFFFFF' },
  { name: 'Superficie alt', hex: '#FAFAFA' },
  { name: 'Borde', hex: '#E0E0E0' },
  { name: 'Borde fuerte', hex: '#D5D5D5' },
  { name: 'Texto', hex: '#212121' },
  { name: 'Texto secundario', hex: '#6F6F6F' },
]

const TYPE_SCALE = [
  { name: 'headline-xl', className: 'text-headline-xl', sample: 'Gestión integral de baterías' },
  { name: 'headline-lg', className: 'text-headline-lg', sample: 'Ficha de serial CIB' },
  { name: 'headline-md', className: 'text-headline-md', sample: 'Solicitud de chequeo' },
  { name: 'headline-sm', className: 'text-headline-sm', sample: 'Inventario del dealer' },
  { name: 'body-lg', className: 'text-body-lg font-normal', sample: 'Cuerpo amplio para párrafos de contexto.' },
  { name: 'body-md', className: 'text-body-md font-normal', sample: 'Cuerpo base 15 px — tablas y formularios.' },
  { name: 'body-sm', className: 'text-body-sm font-normal', sample: 'Metadato, ayuda y marcas temporales.' },
  { name: 'label-lg', className: 'text-label-lg', sample: 'Etiqueta de campo' },
  { name: 'label-md', className: 'text-label-md', sample: 'Etiqueta compacta' },
  { name: 'label-sm', className: 'text-label-sm uppercase tracking-wider', sample: 'Estado' },
]

const BADGES = [
  {
    label: 'Buen estado',
    bg: '#E8F5E9',
    border: '#A5D6A7',
    fg: '#1B5E20',
    contrast: '7,00:1',
    icon: CircleCheck,
  },
  {
    label: 'Descargada',
    bg: '#FFF8E1',
    border: '#FFE082',
    fg: '#8A5A00',
    contrast: '5,58:1',
    icon: BatteryCharging,
  },
  {
    label: 'Para garantía',
    bg: '#FFF3E0',
    border: '#FFCC80',
    fg: '#B03A00',
    contrast: '5,55:1',
    icon: ShieldAlert,
  },
  {
    label: 'Dañada',
    bg: '#FFEBEE',
    border: '#EF9A9A',
    fg: '#B71C1C',
    contrast: '5,75:1',
    icon: OctagonX,
  },
  {
    label: 'CERT-E',
    bg: '#E3F2FD',
    border: '#90CAF9',
    fg: '#0D47A1',
    contrast: '7,56:1',
    icon: CircleCheck,
  },
  {
    label: 'CERT-C · Cancelado',
    bg: '#EDE7F6',
    border: '#B39DDB',
    fg: '#4A148C',
    contrast: '9,81:1',
    icon: CircleAlert,
  },
] as const

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-headline-lg text-viamar-800 border-b border-app-border pb-2 mb-4">{title}</h2>
      {children}
    </section>
  )
}

export function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-app-bg text-ink">
      <header className="bg-white border-b border-app-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <ViamarLogo />
          <p className="text-body-sm text-ink-secondary text-right">
            Prototipo · T0.1.bis · sistema de diseño
          </p>
        </div>
      </header>

      <div className="bg-viamar-50 border-b border-viamar-200">
        <p className="max-w-6xl mx-auto px-6 py-2 text-label-sm uppercase tracking-wider text-viamar-800">
          Prototipo — datos de demostración. El logo es el oficial, vectorizado desde el original.
        </p>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-10">
        <Section id="marca" title="Marca">
          <div className="bg-white border border-app-border rounded p-6 flex flex-col gap-3">
            <ViamarLogo className="h-16 w-auto self-start" />
            <p className="text-body-sm text-ink-secondary max-w-2xl">
              Logo oficial trazado a curvas desde el original del sitio corporativo (1024×330). Escala
              sin pixelarse y no depende de que Open Sans esté instalada. Proporción 3,1:1 — darle
              siempre alto y dejar el ancho automático.
            </p>
            <p className="text-body-sm text-ink-secondary max-w-2xl">
              El azul del logo es <code className="font-code-serial">#0271B8</code> y el gris{' '}
              <code className="font-code-serial">#858688</code>, medidos sobre el archivo original. La
              interfaz usa <code className="font-code-serial">#206AA9</code> (viamar-500), que es el azul
              del CSS del sitio: son dos valores distintos de la misma marca y conviene que Viamar diga
              cuál manda.
            </p>
          </div>
        </Section>

        <Section id="escala" title="Escala Viamar">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-4">
            {SCALE.map((s) => (
              <div key={s.token} className="bg-white border border-app-border rounded overflow-hidden">
                <div className="h-16" style={{ background: s.hex }} />
                <div className="p-2">
                  <p className="text-label-sm uppercase text-ink-secondary">{s.token}</p>
                  <p className="font-code-serial text-[11px]">{s.hex}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto bg-white border border-app-border rounded">
            <table className="w-full text-body-sm">
              <thead className="bg-app-surface-alt text-ink-secondary text-label-md">
                <tr>
                  <th className="text-left px-3 py-2 border-b border-app-border-strong">Token</th>
                  <th className="text-left px-3 py-2 border-b border-app-border-strong">Hex</th>
                  <th className="text-left px-3 py-2 border-b border-app-border-strong">Uso</th>
                </tr>
              </thead>
              <tbody>
                {SCALE.map((s) => (
                  <tr key={s.token} className="hover:bg-viamar-50">
                    <td className="px-3 py-2 border-b border-app-border font-medium">viamar-{s.token}</td>
                    <td className="px-3 py-2 border-b border-app-border font-code-serial">{s.hex}</td>
                    <td className="px-3 py-2 border-b border-app-border">{s.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="neutros" title="Neutros">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {NEUTRALS.map((n) => (
              <div key={n.name} className="bg-white border border-app-border rounded overflow-hidden">
                <div
                  className="h-12 border-b border-app-border"
                  style={{ background: n.hex }}
                />
                <div className="p-2">
                  <p className="text-label-sm text-ink-secondary">{n.name}</p>
                  <p className="font-code-serial text-[11px]">{n.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="tipografia" title="Tipografía">
          <div className="bg-white border border-app-border rounded divide-y divide-app-border">
            {TYPE_SCALE.map((t) => (
              <div key={t.name} className="px-4 py-3 flex flex-col sm:flex-row sm:items-baseline gap-2">
                <code className="text-label-sm text-viamar-700 w-32 shrink-0">{t.name}</code>
                <p className={t.className}>{t.sample}</p>
              </div>
            ))}
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-baseline gap-2">
              <code className="text-label-sm text-viamar-700 w-32 shrink-0">code-serial</code>
              <p className="font-code-serial">CIB-90822173</p>
            </div>
          </div>
          <p className="text-body-sm text-ink-secondary mt-3">
            Open Sans self-hosted vía @fontsource. El tracking de serial evita confundir 0/O, 1/I y 8/B.
          </p>
        </Section>

        <Section id="botones" title="Botones">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="h-10 px-4 rounded bg-viamar-500 text-white font-semibold hover:bg-viamar-600 active:bg-viamar-800"
            >
              Primario
            </button>
            <button
              type="button"
              className="h-10 px-4 rounded border border-app-border-strong bg-white hover:bg-app-bg font-semibold"
            >
              Outlined
            </button>
            <button
              type="button"
              className="h-10 px-4 rounded bg-danger text-white font-semibold hover:bg-[#B71C1C]"
            >
              Destructivo
            </button>
            <a href="#botones" className="text-viamar-700 font-semibold hover:text-viamar-link-hover">
              Enlace de texto
            </a>
          </div>
          <p className="text-body-sm text-ink-secondary mt-3">
            Hover de botón = viamar-600. Hover de enlace = #42A5F5. El acento #039BE5 no se usa como texto.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-body-sm text-ink-secondary">Acento como barra, no como texto:</span>
            <div className="h-2 w-40 rounded-full bg-app-border overflow-hidden">
              <div className="h-full w-2/3 bg-viamar-accent" />
            </div>
            <span className="font-code-serial text-viamar-700">CIB-90822173</span>
          </div>
        </Section>

        <Section id="badges" title="Badges de estado">
          <div className="flex flex-wrap gap-2">
            {BADGES.map((b) => {
              const Icon = b.icon
              return (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-label-sm uppercase"
                  style={{ background: b.bg, borderColor: b.border, color: b.fg }}
                >
                  <Icon size={14} strokeWidth={2.2} />
                  {b.label}
                  <span className="normal-case tracking-normal font-normal opacity-80">· {b.contrast}</span>
                </span>
              )
            })}
          </div>
          <p className="text-body-sm text-ink-secondary mt-3">
            CERT-C = Cancelado (FDD 111/489). Un certificado C no habilita honra. Descargada y Para
            garantía usan el texto oscuro que sí alcanza AA.
          </p>
        </Section>

        <Section id="elevacion" title="Elevación">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded bg-app-bg">
              <p className="text-label-md text-ink-secondary mb-1">Nivel 0 · fondo</p>
              <p className="text-body-sm">#F8F8F8, sin borde.</p>
            </div>
            <div className="p-4 rounded bg-white border border-app-border">
              <p className="text-label-md text-ink-secondary mb-1">Nivel 1 · superficie</p>
              <p className="text-body-sm">Borde 1px #E0E0E0, sin sombra.</p>
            </div>
            <div className="p-4 rounded bg-white border border-app-border-strong shadow-panel">
              <p className="text-label-md text-ink-secondary mb-1">Nivel 2 · panel</p>
              <p className="text-body-sm">0 2px 6px rgba(0,0,0,.06).</p>
            </div>
            <div className="p-4 rounded bg-white shadow-modal">
              <p className="text-label-md text-ink-secondary mb-1">Nivel 3 · modal</p>
              <p className="text-body-sm">0 8px 24px rgba(0,0,0,.12).</p>
            </div>
          </div>
        </Section>

        <Section id="foco" title="Foco y captura">
          <p className="text-body-md text-ink-secondary mb-3">
            Anillo 2px solid #206AA9 con offset 2px. Pensado para teclado y escáner de código de barras.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              defaultValue=""
              placeholder="Escanear o escribir CIB…"
              className="h-10 w-72 px-3 rounded border border-app-border-strong bg-white font-code-serial"
            />
            <button
              type="button"
              className="h-10 px-4 rounded bg-viamar-500 text-white font-semibold inline-flex items-center gap-2 hover:bg-viamar-600"
            >
              <ScanLine size={16} />
              Buscar batería
            </button>
          </div>
        </Section>
      </main>
    </div>
  )
}
