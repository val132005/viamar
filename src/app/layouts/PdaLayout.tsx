import { Outlet } from 'react-router-dom'
import { PrototypeBanner } from '../../components/shell/PrototypeBanner'
import { Header } from '../../components/shell/Header'
import { useAuthStore } from '../../stores/authStore'

export function PdaLayout() {
  const user = useAuthStore((s) => s.usuarioActual)
  if (!user) return null
  return (
    <div className="min-h-screen flex justify-center py-6 px-3">
      {/* Carcasa del terminal: el borde marcado recuerda que esto no es la
          consola de escritorio, sino el equipo que el técnico lleva encima. */}
      <div className="w-full max-w-[380px] min-h-[calc(100vh-3rem)] bg-white border-[3px] border-viamar-800 shadow-modal flex flex-col rounded-[28px] overflow-hidden">
        <PrototypeBanner />
        <Header user={user} showSearch={false} showBrand />
        <main className="flex-1 p-4">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
