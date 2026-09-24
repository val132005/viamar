import {
  BadgeCheck,
  BatteryCharging,
  Handshake,
  PackagePlus,
  Shield,
  Stethoscope,
  Store,
  Truck,
  UserRound,
  Wrench,
} from 'lucide-react'
import { EVENT_LABEL } from '../../domain/catalogs'
import { cn } from '../../lib/cn'

/**
 * Tipos de evento. En una columna donde cada fila lleva uno, el relleno de
 * color satura la vista: el icono y el texto bastan para distinguirlos, y el
 * color queda como refuerzo en el trazo.
 */
const META: Record<string, { icon: typeof Shield; tone: string }> = {
  INGRESO: { icon: PackagePlus, tone: 'text-viamar-600' },
  VENTA_DEALER: { icon: Store, tone: 'text-viamar-600' },
  CHEQUEO: { icon: Stethoscope, tone: 'text-info' },
  ENVIO_CARGA: { icon: Truck, tone: 'text-warning' },
  CARGA_COMPLETADA: { icon: BatteryCharging, tone: 'text-success' },
  VENTA_CLIENTE: { icon: UserRound, tone: 'text-viamar-accent' },
  CERTIFICADO: { icon: BadgeCheck, tone: 'text-info' },
  SOLICITUD_GARANTIA: { icon: Handshake, tone: 'text-critical' },
  DIAGNOSTICO: { icon: Wrench, tone: 'text-ink-secondary' },
  HONRA: { icon: Shield, tone: 'text-viamar-600' },
  REEMPLAZO: { icon: PackagePlus, tone: 'text-viamar-accent' },
}

export function EventChip({ tipo, className }: { tipo: string; className?: string }) {
  const meta = META[tipo] ?? { icon: Shield, tone: 'text-ink-secondary' }
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-body-sm text-ink', className)}>
      <Icon size={14} strokeWidth={2} className={cn('shrink-0', meta.tone)} aria-hidden="true" />
      <span className="truncate">{EVENT_LABEL[tipo] ?? tipo}</span>
    </span>
  )
}
