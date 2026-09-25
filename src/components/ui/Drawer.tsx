import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Panel lateral con la piel del detalle de Trazabilidad. */
export function Drawer({ open, title, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        className="flex-1 bg-[#0b2b4c]/30 backdrop-blur-[3px]"
        aria-label="Cerrar panel"
        onClick={onClose}
      />
      <aside className="flex w-full max-w-md animate-[panel-in_220ms_ease-out] flex-col border-l border-line bg-white shadow-lg">
        <header className="flex items-center justify-between gap-3 border-b border-line-subtle px-5 py-4">
          <h2 className="text-headline-md text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition-colors duration-fast hover:bg-surface-hover hover:text-ink"
          >
            <X size={17} />
          </button>
        </header>
        <div className="scroll-slim flex-1 overflow-auto p-5">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}
