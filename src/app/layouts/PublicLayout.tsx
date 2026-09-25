import { Link, Outlet } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { BrandMesh } from '../../components/brand/BrandMesh'
import { ViamarLogo } from '../../components/brand/ViamarLogo'

/**
 * Superficies públicas (consulta de certificado, design system). Cabecera en
 * el marino del menú lateral con el logo en negativo, y el contenido sobre el
 * mismo fondo frío de la aplicación.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 overflow-hidden text-white shadow-md">
        <BrandMesh />
        <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <Link to="/certificado" className="inline-flex">
            <ViamarLogo className="logo-negativo h-10 w-auto" />
          </Link>
          <Link
            to="/login"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 bg-white/[0.07] px-3.5 text-label-md text-white transition-colors duration-fast hover:bg-white/[0.14]"
          >
            <LogIn size={15} aria-hidden="true" />
            Acceso interno
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 lg:p-8">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
