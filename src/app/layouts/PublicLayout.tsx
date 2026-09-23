import { Link, Outlet } from 'react-router-dom'
import { ViamarLogo } from '../../components/brand/ViamarLogo'
import { PrototypeBanner } from '../../components/shell/PrototypeBanner'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <PrototypeBanner />
      <header className="bg-white border-b border-app-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/certificado">
            <ViamarLogo className="h-10 w-auto" />
          </Link>
          <Link to="/login" className="text-label-md text-viamar-700 hover:text-viamar-link-hover">
            Acceso interno
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  )
}
