import { useEffect, type ReactNode } from 'react'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ToastViewport } from '../../components/ui/Toast'
import { ensureSeed } from '../../stores/hydrate'

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void ensureSeed()
  }, [])
  return (
    <>
      {children}
      <ToastViewport />
      <ConfirmDialog />
    </>
  )
}
