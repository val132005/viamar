import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Drawer({ open, title, onClose, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        className="flex-1 bg-black/20"
        aria-label="Cerrar panel"
        onClick={onClose}
      />
      <aside className="w-full max-w-md bg-white shadow-modal border-l border-app-border flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-app-border">
          <h2 className="text-headline-sm">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="p-4 overflow-auto flex-1">{children}</div>
      </aside>
    </div>
  )
}
