import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BatteryCharging,
  ClipboardList,
  Clock,
  Handshake,
  RadioTower,
  Shield,
  ShieldAlert,
} from 'lucide-react'
import { can } from '../domain/permissions'
import type { Capability } from '../domain/types'
import { useAuthStore } from '../stores/authStore'
import { useInspectionStore } from '../stores/inspectionStore'
import { useIntegrationStore } from '../stores/integrationStore'
import { useWarrantyStore } from '../stores/warrantyStore'
import { useVisibleBatteries } from './useVisibleBatteries'
import { useMatrix } from './usePermission'

export type NotificationTone = 'info' | 'warn' | 'danger' | 'ok'

export type Notification = {
  id: string
  icon: LucideIcon
  tone: NotificationTone
  title: string
  /** Qué hay que hacer con esto, en lenguaje llano. */
  detail: string
  count: number
  to: string
  /** Capacidad necesaria para que el aviso tenga sentido para este usuario. */
  requiere: Capability
}

/**
 * Centro de avisos derivado del estado real de la operación.
 *
 * No existe una tabla de notificaciones en el prototipo, y no se inventa: cada
 * aviso es una consulta viva sobre los datos — cuántas solicitudes están sin
 * asignar, cuántas honras esperan autorización, cuántos mensajes de integración
 * fallaron. Si la cifra es cero, el aviso no aparece.
 */
export function useNotifications(): Notification[] {
  const user = useAuthStore((s) => s.usuarioActual)
  const matrix = useMatrix()
  const solicitudes = useInspectionStore((s) => s.solicitudes)
  const honras = useWarrantyStore((s) => s.honras)
  const eventosIntegracion = useIntegrationStore((s) => s.eventos)
  const baterias = useVisibleBatteries()

  return useMemo(() => {
    const chequeosPendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE').length
    const chequeosEnProceso = solicitudes.filter((s) => s.estado === 'EN_PROCESO').length
    const honrasPorAutorizar = honras.filter(
      (h) => h.origen === 'dealer' && h.estado === 'SOLICITADA',
    ).length
    const paraGarantia = baterias.filter((b) => b.diagnosticoId === 'PARA_GARANTIA').length
    const descargadas = baterias.filter((b) => b.diagnosticoId === 'DESCARGADA').length
    const enviosFallidos = eventosIntegracion.filter((m) => m.estado === 'error').length
    const envejecidas = baterias.filter((b) => {
      if (b.ubicacionTipo !== 'DEALER') return false
      const meses = (Date.now() - new Date(b.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24 * 30)
      return meses >= 6
    }).length

    const candidatas: Notification[] = [
      {
        id: 'honras-dealer',
        icon: Handshake,
        tone: 'danger',
        title: `${honrasPorAutorizar} honras esperan autorización`,
        detail: 'Solicitudes del piloto de distribuidores sin resolver.',
        count: honrasPorAutorizar,
        to: '/honras/dealer',
        requiere: 'autorizar_honra_dealer',
      },
      {
        id: 'chequeos',
        icon: ClipboardList,
        tone: 'warn',
        title: `${chequeosPendientes} chequeos sin asignar`,
        detail: `${chequeosEnProceso} más ya están en proceso.`,
        count: chequeosPendientes,
        to: '/gestion-tecnica',
        requiere: 'crear_solicitud_chequeo',
      },
      {
        id: 'garantia',
        icon: ShieldAlert,
        tone: 'danger',
        title: `${paraGarantia} baterías marcadas para garantía`,
        detail: 'Requieren evaluación técnica comercial.',
        count: paraGarantia,
        to: '/buscar',
        requiere: 'ver_ficha',
      },
      {
        id: 'carga',
        icon: BatteryCharging,
        tone: 'warn',
        title: `${descargadas} descargadas sin enviar a carga`,
        detail: 'Candidatas al proceso de recuperación.',
        count: descargadas,
        to: '/carga',
        requiere: 'enviar_carga',
      },
      {
        id: 'integracion',
        icon: RadioTower,
        tone: 'danger',
        title: `${enviosFallidos} mensajes de integración con error`,
        detail: 'Pendientes de reintento hacia Finance and Operations.',
        count: enviosFallidos,
        to: '/integracion',
        requiere: 'ver_integracion',
      },
      {
        id: 'envejecidas',
        icon: Clock,
        tone: 'warn',
        title: `${envejecidas} seriales envejecidos en dealer`,
        detail: 'Más de seis meses sin rotar.',
        count: envejecidas,
        to: '/distribuidores',
        requiere: 'ver_inventario_dealer',
      },
      {
        id: 'honras-ejecutadas',
        icon: Shield,
        tone: 'ok',
        title: `${honras.filter((h) => h.estado === 'EJECUTADA').length} honras ejecutadas`,
        detail: 'Histórico acumulado de honras cerradas.',
        count: honras.filter((h) => h.estado === 'EJECUTADA').length,
        requiere: 'ejecutar_honra',
        to: '/honras',
      },
    ]

    return candidatas.filter((n) => n.count > 0 && can(matrix, user?.rol, n.requiere))
  }, [solicitudes, honras, eventosIntegracion, baterias, matrix, user?.rol])
}
