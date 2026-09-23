import { Outlet } from 'react-router-dom'
import { AppShell } from '../../components/shell/AppShell'
import { useMatrix } from '../../hooks/usePermission'
import { useAuthStore } from '../../stores/authStore'

export function AppLayout() {
  const user = useAuthStore((s) => s.usuarioActual)
  const matrix = useMatrix()
  if (!user) return null
  return (
    <AppShell user={user} matrix={matrix} variant="internal">
      <Outlet />
    </AppShell>
  )
}
