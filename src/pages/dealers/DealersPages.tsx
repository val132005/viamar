import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, PackageSearch } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { UBICACION_LABEL } from '../../domain/catalogs'
import { formatDate, iso } from '../../domain/dates'
import type { DealerPerfil } from '../../domain/entities'
import { useBatteryStore } from '../../stores/batteryStore'
import { useChargingStore } from '../../stores/chargingStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { withHistory } from '../../stores/historyStore'
import { useUiStore } from '../../stores/uiStore'
import { cn } from '../../lib/cn'

export const AGE_LIMIT_DAYS = 180

export function ageDays(fechaIngreso: string): number {
  const ms = Date.now() - new Date(fechaIngreso).getTime()
  return Math.floor(ms / 86_400_000)
}

const PERFIL_META: Record<DealerPerfil, { label: string; className: string }> = {
  envejecido: {
    label: 'Envejecido',
    className: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  impecable: {
    label: 'Impecable',
    className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  incidencias: {
    label: 'Incidencias',
    className: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  normal: {
    label: 'Normal',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
}

export function PerfilBadge({ perfil }: { perfil: DealerPerfil }) {
  const meta = PERFIL_META[perfil] ?? PERFIL_META.normal
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-label-sm uppercase font-semibold',
        meta.className,
      )}
    >
      {meta.label}
    </span>
  )
}

const INCIDENCIA_DIAG = new Set(['DESCARGADA', 'DANADA', 'PARA_GARANTIA'])

export function DealersListPage() {
  const dealers = useDistributorStore((s) => s.dealers)
  const baterias = useBatteryStore((s) => s.baterias)
  const rows = useMemo(
    () =>
      dealers.map((d) => {
        const inv = Object.values(baterias).filter(
          (b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === d.id,
        )
        const aged = inv.filter((b) => ageDays(b.fechaIngreso) > AGE_LIMIT_DAYS).length
        const incidencias = inv.filter((b) => INCIDENCIA_DIAG.has(b.diagnosticoId)).length
        return { ...d, stock: inv.length, aged, incidencias }
      }),
    [dealers, baterias],
  )
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-headline-lg text-viamar-800">Inventario de distribuidores</h1>
      <p className="text-body-sm text-ink-secondary">
        Perfil, stock en dealer, seriales envejecidos (&gt;{AGE_LIMIT_DAYS} días) e incidencias
        diagnosticadas.
      </p>
      <DataTable
        columns={[
          {
            key: 'nombre',
            header: 'Dealer',
            render: (d) => (
              <Link className="text-viamar-700 font-semibold" to={`/distribuidores/${d.id}`}>
                {d.nombre}
              </Link>
            ),
          },
          { key: 'localidad', header: 'Localidad' },
          {
            key: 'perfil',
            header: 'Perfil',
            render: (d) => <PerfilBadge perfil={d.perfil} />,
          },
          { key: 'stock', header: 'Stock', render: (d) => String(d.stock) },
          {
            key: 'aged',
            header: `Envejecido >${AGE_LIMIT_DAYS}d`,
            render: (d) => (
              <span className={cn('font-semibold', d.aged > 0 && 'text-amber-700')}>{d.aged}</span>
            ),
          },
          {
            key: 'incidencias',
            header: 'Incidencias',
            render: (d) => (
              <span className={cn('font-semibold', d.incidencias > 0 && 'text-rose-700')}>
                {d.incidencias}
              </span>
            ),
          },
        ]}
        rows={rows}
        rowKey={(d) => d.id}
      />
    </div>
  )
}

export function DealerDetailPage() {
  const { id = '' } = useParams()
  const dealer = useDistributorStore((s) => s.dealers.find((d) => d.id === id))
  const baterias = useBatteryStore((s) => s.baterias)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const addSolicitud = useInspectionStore((s) => s.addSolicitud)
  const centros = useChargingStore((s) => s.centros)
  const toast = useUiStore((s) => s.pushToast)
  const ask = useUiStore((s) => s.askConfirm)

  const inv = useMemo(
    () =>
      Object.values(baterias)
        .filter((b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === id)
        .map((b) => ({ ...b, edad: ageDays(b.fechaIngreso) }))
        .sort((a, b) => b.edad - a.edad),
    [baterias, id],
  )

  if (!dealer) return <p>Dealer no encontrado.</p>

  async function marcarVerificado(serial: string) {
    const ok = await ask({
      title: 'Confirmar saneamiento',
      message: `Marcar ${serial} como existencia verificada en ${dealer!.nombre}. Quedará registrado en el historial del serial.`,
      confirmLabel: 'Marcar verificado',
    })
    if (!ok) return
    withHistory(
      serial,
      'CHEQUEO',
      `Saneamiento: existencia verificada en dealer ${dealer!.nombre}`,
      () => undefined,
      { estadoNuevo: 'DEALER' },
    )
    toast(`${serial} verificado y registrado en historial`, 'ok')
  }

  async function reportarFaltante(serial: string) {
    const ok = await ask({
      title: 'Reportar faltante',
      message: `${serial} no está en el inventario físico de ${dealer!.nombre}. Se creará una solicitud de chequeo en Gestión técnica para la visita de verificación.`,
      confirmLabel: 'Reportar faltante',
      danger: true,
    })
    if (!ok) return
    const n = solicitudes.length + 1
    const numero = `SCH-2026-${String(n).padStart(3, '0')}`
    const now = iso(new Date())
    addSolicitud({
      id: `sch-${crypto.randomUUID().slice(0, 8)}`,
      numero,
      dealerId: dealer!.id,
      vendedorId: dealer!.vendedorAsignado,
      supervisorId: 'usr-elizabeth',
      estado: 'PENDIENTE',
      fechaCreacion: now,
      fechaVisita: now,
      centroId: centros[0]?.id ?? 'centro-sd',
      lineas: [
        {
          id: `lin-${crypto.randomUUID().slice(0, 8)}`,
          serial,
          voltaje: 0,
          densidad: 0,
          capacidadMedida: 0,
          diagnostico: 'PENDIENTE',
          accionSugerida: 'Verificar faltante detectado en saneamiento',
        },
      ],
    })
    withHistory(
      serial,
      'CHEQUEO',
      `Saneamiento: faltante reportado en ${dealer!.nombre} · solicitud ${numero}`,
      () => undefined,
      { estadoNuevo: 'DEALER', referenciaId: numero },
    )
    toast(`Faltante registrado. Solicitud ${numero} creada en Gestión técnica`, 'ok')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link className="text-body-sm text-viamar-700" to="/distribuidores">
          ← Distribuidores
        </Link>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <h1 className="text-headline-lg text-viamar-800">{dealer.nombre}</h1>
          <PerfilBadge perfil={dealer.perfil} />
        </div>
        <p className="text-body-sm text-ink-secondary">
          {dealer.localidad} · RNC {dealer.rnc} · {inv.length} en stock ·{' '}
          {inv.filter((b) => b.edad > AGE_LIMIT_DAYS).length} envejecidos · última visita{' '}
          {dealer.ultimaVisita ? formatDate(dealer.ultimaVisita) : '—'}
        </p>
      </div>
      {inv.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Sin inventario"
          description="Este dealer no tiene seriales asignados."
        />
      ) : (
        <DataTable
          columns={[
            {
              key: 'serial',
              header: 'Serial',
              render: (b) => (
                <Link className="font-code-serial text-viamar-700" to={`/serial/${b.serial}`}>
                  {b.serial}
                </Link>
              ),
            },
            {
              key: 'edad',
              header: 'Edad (días)',
              render: (b) =>
                b.edad > AGE_LIMIT_DAYS ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <AlertTriangle size={14} /> {b.edad} · Envejecido
                  </span>
                ) : (
                  <span>{b.edad}</span>
                ),
            },
            {
              key: 'ingreso',
              header: 'Ingreso',
              render: (b) => formatDate(b.fechaIngreso),
            },
            { key: 'ubicacion', header: 'Ubicación', render: () => UBICACION_LABEL.DEALER },
            {
              key: 'diag',
              header: 'Diagnóstico',
              render: (b) => <StatusBadge catalogId={b.diagnosticoId} />,
            },
            {
              key: 'saneamiento',
              header: 'Saneamiento',
              render: (b) => (
                <div className="flex gap-1">
                  <Button
                    variant="outlined"
                    className="h-8 text-label-md"
                    title="Marcar existencia verificada"
                    onClick={() => void marcarVerificado(b.serial)}
                  >
                    <BadgeCheck size={14} /> Verificado
                  </Button>
                  <Button
                    variant="outlined"
                    className="h-8 text-label-md"
                    title="Reportar faltante"
                    onClick={() => void reportarFaltante(b.serial)}
                  >
                    Faltante
                  </Button>
                </div>
              ),
            },
          ]}
          rows={inv}
          rowKey={(b) => b.serial}
        />
      )}
    </div>
  )
}
