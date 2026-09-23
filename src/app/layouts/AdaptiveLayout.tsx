import { useAuthStore } from '../../stores/authStore'
import { AppLayout } from './AppLayout'
import { DealerLayout } from './DealerLayout'

export function AdaptiveLayout() {
  const role = useAuthStore((s) => s.usuarioActual?.rol)
  if (role === 'DISTRIBUIDOR') return <DealerLayout />
  return <AppLayout />
}
