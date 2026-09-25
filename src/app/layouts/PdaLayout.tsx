import { Outlet } from 'react-router-dom'
import { Header } from '../../components/shell/Header'
import { useAuthStore } from '../../stores/authStore'

export function PdaLayout() {
  const user = useAuthStore((s) => s.usuarioActual)
  if (!user) return null
  return (
    <div className="min-h-screen flex justify-center py-6 px-3">
      {/* Carcasa del terminal: el borde marcado recuerda que esto no es la
          consola de escritorio, sino el equipo que el técnico lleva encima. */}
      <div className="flex w-full max-w-[392px] rounded-[34px] bg-gradient-to-b from-[#0b2b4c] to-[#0a2843] p-[7px] shadow-lg">
      <div className="flex min-h-[calc(100vh-3rem-14px)] w-full flex-col overflow-hidden rounded-[28px] bg-surface-sunken">
        <Header user={user} showSearch={false} showBrand />
        <main className="flex-1 p-4">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      </div>
    </div>
  )
}
