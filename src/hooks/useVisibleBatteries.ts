import type { Bateria, Usuario } from '../domain/types'
import { useAuthStore } from '../stores/authStore'
import { useBatteryStore } from '../stores/batteryStore'
import { useCertificateStore } from '../stores/certificateStore'
import { useDistributorStore } from '../stores/distributorStore'

export function isBatteryVisible(
  bateria: Bateria | undefined,
  user: Usuario | null,
  certificados = useCertificateStore.getState().certificados,
): boolean {
  if (!bateria) return false
  if (!user || user.rol !== 'DISTRIBUIDOR') return true
  if (bateria.ubicacionTipo === 'DEALER' && bateria.ubicacionId === user.dealerId) return true
  return certificados.some((c) => c.serial === bateria.serial && c.dealerId === user.dealerId)
}

export function useVisibleBatteries(): Bateria[] {
  const user = useAuthStore((s) => s.usuarioActual)
  const baterias = useBatteryStore((s) => s.baterias)
  const certificados = useCertificateStore((s) => s.certificados)
  const list = Object.values(baterias)
  if (!user || user.rol !== 'DISTRIBUIDOR') return list
  return list.filter(
    (b) =>
      (b.ubicacionTipo === 'DEALER' && b.ubicacionId === user.dealerId) ||
      certificados.some((c) => c.serial === b.serial && c.dealerId === user.dealerId),
  )
}

export function searchVisible(query: string, user: Usuario | null): Bateria[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const baterias = Object.values(useBatteryStore.getState().baterias)
  const certificados = useCertificateStore.getState().certificados
  const clientes = useDistributorStore.getState().clientes
  const digits = q.replace(/-/g, '')
  return baterias.filter((b) => {
    if (!isBatteryVisible(b, user, certificados)) return false
    if (b.serial.toLowerCase().includes(q)) return true
    const cert = certificados.find((c) => c.serial === b.serial)
    if (!cert) return false
    const cli = clientes.find((c) => c.id === cert.clienteId)
    if (!cli) return false
    return (
      cli.nombre.toLowerCase().includes(q) || cli.documento.replace(/-/g, '').includes(digits)
    )
  })
}
