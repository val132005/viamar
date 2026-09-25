import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
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
      <div className="absolute inset-0">
        <BrandMesh />
      </div>
      <div className="relative flex w-full max-w-[460px] flex-col items-center gap-6">
      <ViamarLogo className="logo-negativo h-11 w-auto" />
      <div className="surface-raised w-full max-h-[min(80vh,760px)] overflow-hidden flex flex-col">
        <div className="shrink-0 border-b border-line-subtle px-5 pb-4 pt-5">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-viamar-50">
              <MicrosoftMark className="h-4 w-4" />
            </span>
            <h1 className="text-headline-lg text-ink">Seleccionar una cuenta</h1>
          </div>
          <p className="text-body-sm text-ink-secondary">
            Siete cuentas demo. El token simulado incluye el rol y, si aplica, el dealer.
          </p>
        </div>
        <ul className="scroll-slim overflow-y-auto">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.id} className="border-b border-[#edf1f6] last:border-b-0">
              <button
                type="button"
                onClick={() => choose(account.id)}
                className="group w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-fast hover:bg-[#f7fafd] hover:shadow-[inset_3px_0_0_#0463dc]"
              >
                <UserAvatar user={account} />
                <span className="min-w-0 flex-1">
                  <span className="block text-label-lg text-ink truncate">{account.nombre}</span>
                  <span className="block text-body-sm text-ink-secondary truncate">
                    {account.email}
                  </span>
                  <span className="block text-label-sm text-viamar-600">
                    {ROLE_LABEL[account.rol]}
                    {account.dealerNombre ? ` · ${account.dealerNombre}` : ''}
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-ink-tertiary transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-viamar-500"
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  )
}
