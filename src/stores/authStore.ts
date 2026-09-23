import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SimulatedToken, Usuario } from '../domain/types'
import { accountById, DEMO_ACCOUNTS } from '../seed/demoAccounts'
import { persistName, PERSIST_VERSION } from './persist'

function issueToken(user: Usuario): SimulatedToken {
  const now = Date.now()
  return {
    typ: 'Bearer',
    iss: 'login.microsoftonline.com/viamar-demo',
    aud: 'api://viamar-baterias',
    sub: user.id,
    name: user.nombre,
    preferred_username: user.email,
    roles: [user.rol],
    dealerId: user.dealerId,
    iat: now,
    exp: now + 8 * 60 * 60 * 1000,
  }
}

type AuthState = {
  usuarioActual: Usuario | null
  token: SimulatedToken | null
  cuentasDemo: Usuario[]
  login: (cuentaId: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuarioActual: null,
      token: null,
      cuentasDemo: DEMO_ACCOUNTS,
      login: (cuentaId) => {
        const user = accountById(cuentaId)
        if (!user) return false
        set({ usuarioActual: user, token: issueToken(user) })
        return true
      },
      logout: () => set({ usuarioActual: null, token: null }),
    }),
    {
      name: persistName('auth'),
      version: PERSIST_VERSION,
      partialize: (s) => ({
        usuarioActual: s.usuarioActual,
        token: s.token,
      }),
    },
  ),
)
