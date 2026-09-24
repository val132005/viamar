import { Link, Outlet } from 'react-router-dom'
import { ViamarLogo } from '../../components/brand/ViamarLogo'
import { PrototypeBanner } from '../../components/shell/PrototypeBanner'

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <PrototypeBanner />
      <header className="bg-white/85 backdrop-blur-md border-b border-app-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link to="/certificado" className="inline-flex">
            <ViamarLogo className="h-10 w-auto" />
          </Link>
          <Link
            to="/login"
            className="text-label-md text-viamar-700 hover:text-viamar-link-hover transition-colors"
          >
            Acceso interno
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 lg:p-8">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
