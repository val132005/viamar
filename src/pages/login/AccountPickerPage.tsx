import { useNavigate } from 'react-router-dom'
import { ROLE_LABEL } from '../../domain/permissions'
import { UserAvatar } from '../../components/brand/UserAvatar'
import { MicrosoftMark } from '../../components/brand/MicrosoftMark'
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
    <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white shadow-modal">
        <div className="p-6 border-b border-app-border">
          <MicrosoftMark className="h-5 w-5 mb-3" />
          <h1 className="text-[22px] font-semibold">Seleccionar una cuenta</h1>
          <p className="text-body-sm text-ink-secondary mt-1">
            Siete cuentas demo. El token simulado incluye el rol y, si aplica, el dealer.
          </p>
        </div>
        <ul>
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.id} className="border-b border-app-border last:border-b-0">
              <button
                type="button"
                onClick={() => choose(account.id)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-app-bg"
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
