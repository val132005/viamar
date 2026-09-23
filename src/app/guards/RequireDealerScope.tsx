import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

export function RequireInternal() {
  const role = useAuthStore((s) => s.usuarioActual?.rol)
  if (role === 'DISTRIBUIDOR') return <Navigate to="/dealer" replace />
  return <Outlet />
}

export function RequireDealer() {
  const role = useAuthStore((s) => s.usuarioActual?.rol)
  if (role !== 'DISTRIBUIDOR') return <Navigate to="/" replace />
  return <Outlet />
}

export function RequireDealerScope() {
  return <Outlet />
}
