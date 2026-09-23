import { BadgeCheck, BatteryCharging, Shield, Warehouse } from 'lucide-react'
import { ROLE_LABEL } from '../../domain/permissions'
import type { Role } from '../../domain/types'
import { KpiCard } from '../../components/ui/KpiCard'
import { MonthlyHonrasChart, type MesHonra } from '../../components/ui/MonthlyHonrasChart'
import { DataTable } from '../../components/ui/DataTable'
import { EVENT_LABEL } from '../../domain/catalogs'
import { formatDate } from '../../domain/dates'
import { useVisibleBatteries } from '../../hooks/useVisibleBatteries'
import { useAuthStore } from '../../stores/authStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useHistoryStore } from '../../stores/historyStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { useWarrantyStore } from '../../stores/warrantyStore'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const user = useAuthStore((s) => s.usuarioActual)
  const baterias = useVisibleBatteries()
  const certificados = useCertificateStore((s) => s.certificados)
  const honras = useWarrantyStore((s) => s.honras)
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const eventos = useHistoryStore((s) => s.eventos)
  if (!user) return null

  const visiblesSerial = new Set(baterias.map((b) => b.serial))
  const certE = certificados.filter((c) => visiblesSerial.has(c.serial) && c.estado === 'E').length
  const honrasMes = honras.filter((h) => visiblesSerial.has(h.serialOriginal)).length
  const chequeosAbiertos = solicitudes.filter(
    (s) => s.estado === 'PENDIENTE' || s.estado === 'EN_PROCESO',
  ).length
  const enDealer = baterias.filter((b) => b.ubicacionTipo === 'DEALER').length
  const enCarga = baterias.filter((b) => b.ubicacionTipo === 'CENTRO_CARGA').length
  const aged = baterias.filter((b) => {
    const months = (Date.now() - new Date(b.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24 * 30)
    return b.ubicacionTipo === 'DEALER' && months >= 6
  }).length

  const kpis: Record<Role, { label: string; value: string; hint: string; icon: typeof Shield }[]> = {
    ADMIN: [
      { label: 'Seriales vivos', value: String(baterias.length), hint: 'Seed cargado', icon: Warehouse },
      { label: 'Honras', value: String(honrasMes), hint: 'Históricas en seed', icon: Shield },
      { label: 'Chequeos abiertos', value: String(chequeosAbiertos), hint: 'Gestión técnica', icon: BatteryCharging },
      { label: 'Certificados E', value: String(certE), hint: 'Vigentes', icon: BadgeCheck },
    ],
    VENDEDOR_ND: [
      { label: 'En dealers', value: String(enDealer), hint: 'Inventario externo', icon: Warehouse },
      { label: 'Stock envejecido', value: String(aged), hint: 'Más de 6 meses', icon: Shield },
      { label: 'Chequeos abiertos', value: String(chequeosAbiertos), hint: 'Solicitudes', icon: BatteryCharging },
      { label: 'Certificados E', value: String(certE), hint: 'Vigentes', icon: BadgeCheck },
    ],
    SUPERVISOR_GT: [
      { label: 'Solicitudes abiertas', value: String(chequeosAbiertos), hint: 'Chequeo técnico', icon: BatteryCharging },
      { label: 'En centro de carga', value: String(enCarga), hint: 'FIFO', icon: Warehouse },
      { label: 'Para garantía', value: String(baterias.filter((b) => b.diagnosticoId === 'PARA_GARANTIA').length), hint: 'Diagnóstico', icon: Shield },
      { label: 'Seriales visibles', value: String(baterias.length), hint: 'Ciclo de vida', icon: BadgeCheck },
    ],
    TECNICO: [
      { label: 'En centro de carga', value: String(enCarga), hint: 'Cola', icon: BatteryCharging },
      { label: 'Seriales', value: String(baterias.length), hint: 'Visibles', icon: Warehouse },
      { label: 'Chequeos abiertos', value: String(chequeosAbiertos), hint: 'Pendientes', icon: Shield },
      { label: 'Honras', value: String(honrasMes), hint: 'Histórico', icon: BadgeCheck },
    ],
    VENTAS_GARANTIAS: [
      { label: 'Honras', value: String(honrasMes), hint: 'Mostrador + dealer', icon: Shield },
      { label: 'Certificados E', value: String(certE), hint: 'Vigentes', icon: BadgeCheck },
      { label: 'En dealers', value: String(enDealer), hint: 'Inventario externo', icon: Warehouse },
      { label: 'Seriales', value: String(baterias.length), hint: 'Ciclo de vida', icon: BatteryCharging },
    ],
    DISTRIBUIDOR: [
      { label: 'Mi inventario', value: String(enDealer), hint: 'Sólo este dealer', icon: Warehouse },
      { label: 'Certificados E', value: String(certE), hint: 'Vigentes', icon: BadgeCheck },
      { label: 'Honras ligadas', value: String(honras.filter((h) => visiblesSerial.has(h.serialOriginal)).length), hint: 'Piloto', icon: Shield },
      { label: 'Seriales visibles', value: String(baterias.length), hint: 'Incluye vendidas', icon: BatteryCharging },
    ],
    CONSULTA: [
      { label: 'Seriales vivos', value: String(baterias.length), hint: 'Sólo lectura', icon: Warehouse },
      { label: 'Honras', value: String(honrasMes), hint: 'USD en ficha', icon: Shield },
      { label: 'Chequeos abiertos', value: String(chequeosAbiertos), hint: 'GT', icon: BatteryCharging },
      { label: 'Certificados E', value: String(certE), hint: 'Vigentes', icon: BadgeCheck },
    ],
  }

  const recientes = eventos
    .filter((e) => visiblesSerial.has(e.serial))
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 8)

  const porMes: MesHonra[] = (() => {
    const map = new Map<string, MesHonra>()
    for (const h of honras) {
      if (!visiblesSerial.has(h.serialOriginal)) continue
      const mes = h.fechaCalculo.slice(0, 7)
      const cur = map.get(mes) ?? { mes, acreditar: 0, cliente: 0 }
      cur.acreditar += h.resultadoCalculo.montoAcreditar
      cur.cliente += h.resultadoCalculo.montoCliente
      map.set(mes, cur)
    }
    return [...map.values()].sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6)
  })()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-headline-lg text-viamar-800">Dashboard</h1>
        <p className="text-body-sm text-ink-secondary">
          {user.nombre} · {ROLE_LABEL[user.rol]}
          {user.dealerNombre ? ` · ${user.dealerNombre}` : ''}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis[user.rol].map((c) => (
          <KpiCard key={c.label} label={c.label} value={c.value} hint={c.hint} icon={c.icon} />
        ))}
      </div>
      <MonthlyHonrasChart datos={porMes} />
      <DataTable
        columns={[
          {
            key: 'serial',
            header: 'Serial',
            render: (r) => (
              <Link to={`/serial/${r.serial}`} className="font-code-serial text-viamar-700">
                {r.serial}
              </Link>
            ),
          },
          {
            key: 'tipo',
            header: 'Evento',
            render: (r) => EVENT_LABEL[r.tipo] ?? r.tipo,
          },
          {
            key: 'fecha',
            header: 'Fecha',
            render: (r) => formatDate(r.fecha),
          },
        ]}
        rows={recientes}
        rowKey={(r) => r.id}
        emptyTitle="Sin movimientos"
        emptyDescription="El seed no se ha hidratado todavía."
      />
    </div>
  )
}
