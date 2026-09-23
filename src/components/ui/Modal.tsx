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
        className="absolute inset-0 bg-black/30"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white rounded shadow-modal w-full max-w-lg"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-app-border">
          <h2 id="modal-title" className="text-headline-sm">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="p-4">{children}</div>
        {footer ? (
          <footer className="px-4 py-3 border-t border-app-border flex justify-end gap-2">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
