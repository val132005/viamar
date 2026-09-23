import { Navigate, Outlet } from 'react-router-dom'
import type { Capability } from '../../domain/types'
import { useCanAny } from '../../hooks/usePermission'

export function RequirePermission({ anyOf }: { anyOf: Capability[] }) {
  const allowed = useCanAny(anyOf)
  if (!allowed) return <Navigate to="/" replace />
  return <Outlet />
}
