import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, title, onClose, children, footer }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-viamar-900/40 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white rounded-xl shadow-modal w-full max-w-lg page-enter"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <h2 id="modal-title" className="text-headline-sm">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="h-8 w-8 rounded-lg hover:bg-viamar-50 inline-flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </header>
        <div className="p-5">{children}</div>
        {footer ? (
          <footer className="px-5 py-4 border-t border-app-border flex justify-end gap-2">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
