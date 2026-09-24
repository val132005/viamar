import { useNavigate } from 'react-router-dom'
import { BrandMesh } from '../../components/brand/BrandMesh'
import { MicrosoftMark } from '../../components/brand/MicrosoftMark'
import { ViamarLogo } from '../../components/brand/ViamarLogo'

export function LoginPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-viamar-900 text-white p-12">
        <BrandMesh />
        <div className="relative">
          <div className="inline-flex bg-white rounded-xl px-4 py-3 shadow-lift">
            <ViamarLogo className="h-10 w-auto" />
          </div>
        </div>
        <div className="relative max-w-lg">
          <p className="text-label-sm uppercase tracking-[0.18em] text-viamar-accent mb-3">
            Grupo Viamar
          </p>
          <h1 className="text-[40px] leading-[1.15] font-bold tracking-tight">
            Gestión integral de baterías
          </h1>
          <p className="mt-4 text-body-lg text-white/70 max-w-md">
            Ciclo de vida, certificado digital, chequeo técnico y honra de garantía en un solo
            lugar — con la identidad de marca de Viamar.
          </p>
        </div>
        <p className="relative text-label-sm uppercase tracking-[0.14em] text-white/40">
          Prototipo · Entra ID simulado
        </p>
      </section>

      <section className="relative flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="lg:hidden mb-8 bg-white rounded-xl px-4 py-3 shadow-panel">
          <ViamarLogo className="h-9 w-auto" />
        </div>
        <div className="surface w-full max-w-[440px] p-8 flex flex-col gap-6">
          <MicrosoftMark className="h-6 w-6" />
          <div>
            <h1 className="text-[24px] font-semibold text-viamar-900">Iniciar sesión</h1>
            <p className="text-body-sm text-ink-secondary mt-1">
              Use su cuenta de trabajo de Grupo Viamar (Entra ID simulado).
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login/cuentas')}
            className="h-12 w-full bg-[#2F2F2F] text-white font-semibold rounded-lg inline-flex items-center justify-center gap-2 hover:bg-black transition-transform duration-200 ease-brand hover:-translate-y-px"
          >
            <MicrosoftMark className="h-4 w-4" />
            Continuar con Microsoft
          </button>
          <p className="text-[12px] text-ink-secondary">
            Prototipo: no hay tenant real. El selector emite un token ficticio con{' '}
            <code>roles[]</code> listo para sustituir por MSAL.
          </p>
        </div>
      </section>
    </div>
  )
}
