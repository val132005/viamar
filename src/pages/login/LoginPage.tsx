import { useNavigate } from 'react-router-dom'
import { MicrosoftMark } from '../../components/brand/MicrosoftMark'
import { ViamarLogo } from '../../components/brand/ViamarLogo'

export function LoginPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white shadow-modal p-8 flex flex-col gap-6">
          <MicrosoftMark className="h-6 w-6" />
          <div>
            <h1 className="text-[24px] font-semibold text-[#1b1b1b]">Iniciar sesión</h1>
            <p className="text-body-sm text-ink-secondary mt-1">
              Use su cuenta de trabajo de Grupo Viamar (Entra ID simulado).
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login/cuentas')}
            className="h-11 w-full bg-[#2F2F2F] text-white font-semibold rounded-sm inline-flex items-center justify-center gap-2 hover:bg-black"
          >
            <MicrosoftMark className="h-4 w-4" />
            Continuar con Microsoft
          </button>
          <p className="text-[12px] text-ink-secondary">
            Prototipo: no hay tenant real. El selector emite un token ficticio con{' '}
            <code>roles[]</code> listo para sustituir por MSAL.
          </p>
        </div>
      </div>
      <div className="py-4 flex justify-center">
        <ViamarLogo className="h-8 w-[160px] opacity-80" />
      </div>
    </div>
  )
}
