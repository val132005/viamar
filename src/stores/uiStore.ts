import { create } from 'zustand'

export type ToastTone = 'ok' | 'warn' | 'error' | 'info'

export type ToastItem = {
  id: string
  message: string
  tone: ToastTone
}

type ConfirmRequest = {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  resolve: (ok: boolean) => void
}

type UiState = {
  toasts: ToastItem[]
  confirm: ConfirmRequest | null
  drawerOpen: boolean
  drawerTitle: string
  pushToast: (message: string, tone?: ToastTone) => void
  dismissToast: (id: string) => void
  askConfirm: (opts: Omit<ConfirmRequest, 'resolve'>) => Promise<boolean>
  closeConfirm: (ok: boolean) => void
  openDrawer: (title: string) => void
  closeDrawer: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  confirm: null,
  drawerOpen: false,
  drawerTitle: '',
  pushToast: (message, tone = 'info') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }))
    window.setTimeout(() => get().dismissToast(id), 4200)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  askConfirm: (opts) =>
    new Promise<boolean>((resolve) => {
      set({ confirm: { ...opts, resolve } })
    }),
  closeConfirm: (ok) => {
    const current = get().confirm
    current?.resolve(ok)
    set({ confirm: null })
  },
  openDrawer: (title) => set({ drawerOpen: true, drawerTitle: title }),
  closeDrawer: () => set({ drawerOpen: false }),
}))
