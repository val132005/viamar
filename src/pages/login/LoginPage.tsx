import { useNavigate } from 'react-router-dom'
import { BrandMesh } from '../../components/brand/BrandMesh'
import { MicrosoftMark } from '../../components/brand/MicrosoftMark'
import { ViamarLogo } from '../../components/brand/ViamarLogo'

export function LoginPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden text-white p-12">
        <BrandMesh />
        <div className="relative">
          <ViamarLogo className="logo-negativo h-12 w-auto" />
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
        <div className="lg:hidden mb-8">
          <ViamarLogo className="h-10 w-auto" />
        </div>
        <div className="surface-raised w-full max-w-[440px] p-8 flex flex-col gap-6">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-viamar-50">
            <MicrosoftMark className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-headline-xl text-ink">Iniciar sesión</h1>
            <p className="text-body-sm text-ink-secondary mt-1">
              Use su cuenta de trabajo de Grupo Viamar (Entra ID simulado).
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login/cuentas')}
            className="h-12 w-full rounded-lg bg-gradient-to-b from-[#0a6fe8] to-[#0463dc] text-white font-semibold inline-flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(4,100,220,0.3)] transition-[filter,transform] duration-200 ease-brand hover:-translate-y-px hover:brightness-110"
          >
            <MicrosoftMark className="h-4 w-4" />
            Continuar con Microsoft
          </button>
          <p className="rounded-lg border border-[#e6edf5] bg-[#f7fafd] px-3 py-2 text-[12px] text-ink-secondary">
            Prototipo: no hay tenant real. El selector emite un token ficticio con{' '}
            <code>roles[]</code> listo para sustituir por MSAL.
          </p>
        </div>
      </section>
    </div>
  )
}
