import { Outlet } from 'react-router-dom'
import { PrototypeBanner } from '../../components/shell/PrototypeBanner'
import { Header } from '../../components/shell/Header'
import { useAuthStore } from '../../stores/authStore'

export function PdaLayout() {
  const user = useAuthStore((s) => s.usuarioActual)
  if (!user) return null
  return (
    <div className="min-h-screen bg-app-bg flex justify-center">
      <div className="w-full max-w-[360px] min-h-screen bg-white border-x border-app-border shadow-modal flex flex-col">
        <PrototypeBanner />
        <Header user={user} showSearch={false} />
        <main className="flex-1 p-3">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
