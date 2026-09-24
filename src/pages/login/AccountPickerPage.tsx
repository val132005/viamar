import { useNavigate } from 'react-router-dom'
import { ROLE_LABEL } from '../../domain/permissions'
import { BrandMesh } from '../../components/brand/BrandMesh'
import { UserAvatar } from '../../components/brand/UserAvatar'
import { MicrosoftMark } from '../../components/brand/MicrosoftMark'
import { ViamarLogo } from '../../components/brand/ViamarLogo'
import { DEMO_ACCOUNTS } from '../../seed/demoAccounts'
import { useAuthStore } from '../../stores/authStore'

export function AccountPickerPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  function choose(id: string) {
    const ok = login(id)
    if (!ok) return
    const user = DEMO_ACCOUNTS.find((a) => a.id === id)
    navigate(user?.rol === 'DISTRIBUIDOR' ? '/dealer' : '/')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-viamar-900">
        <BrandMesh />
      </div>
      <div className="relative w-full max-w-[460px] max-h-[min(90vh,840px)] surface overflow-hidden flex flex-col">
        <div className="p-5 border-b border-app-border bg-gradient-to-br from-white to-viamar-50 shrink-0">
          <ViamarLogo className="h-7 w-auto mb-3" />
          <div className="flex items-center gap-2 mb-1">
            <MicrosoftMark className="h-4 w-4" />
            <h1 className="text-[20px] font-semibold text-viamar-900">Seleccionar una cuenta</h1>
          </div>
          <p className="text-body-sm text-ink-secondary">
            Siete cuentas demo. El token simulado incluye el rol y, si aplica, el dealer.
          </p>
        </div>
        <ul className="overflow-y-auto">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.id} className="border-b border-app-border last:border-b-0">
              <button
                type="button"
                onClick={() => choose(account.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-viamar-50 transition-colors"
              >
                <UserAvatar user={account} />
                <span className="min-w-0">
                  <span className="block text-label-md truncate">{account.nombre}</span>
                  <span className="block text-body-sm text-ink-secondary truncate">
                    {account.email}
                  </span>
                  <span className="block text-label-sm text-viamar-700">
                    {ROLE_LABEL[account.rol]}
                    {account.dealerNombre ? ` · ${account.dealerNombre}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
