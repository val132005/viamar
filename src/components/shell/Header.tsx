import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Users } from 'lucide-react'
import { ROLE_LABEL } from '../../domain/permissions'
import type { Usuario } from '../../domain/types'
import { useAuthStore } from '../../stores/authStore'
import { UserAvatar } from '../brand/UserAvatar'
import { GlobalSearch } from './GlobalSearch'

export function Header({ user, showSearch = true }: { user: Usuario; showSearch?: boolean }) {
  const [open, setOpen] = useState(false)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <header className="h-14 bg-white border-b border-app-border flex items-center gap-4 px-4">
      {showSearch ? <GlobalSearch /> : <div className="flex-1" />}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded px-1 py-1 hover:bg-app-bg"
        >
          <UserAvatar user={user} size={32} />
          <span className="hidden sm:flex flex-col items-start">
            <span className="text-label-md leading-4">{user.nombre}</span>
            <span className="text-label-sm text-ink-secondary">{ROLE_LABEL[user.rol]}</span>
          </span>
        </button>
        {open ? (
          <div className="absolute right-0 mt-1 w-64 bg-white border border-app-border rounded shadow-panel z-20 py-1">
            <p className="px-3 py-2 text-body-sm text-ink-secondary">{user.email}</p>
            <Link
              to="/login/cuentas"
              className="flex items-center gap-2 px-3 py-2 text-body-sm hover:bg-viamar-50"
              onClick={() => setOpen(false)}
            >
              <Users size={14} />
              Cambiar de cuenta
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-body-sm hover:bg-viamar-50"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
