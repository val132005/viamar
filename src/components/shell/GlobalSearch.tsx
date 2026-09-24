import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command, Search } from 'lucide-react'
import { isSerialQuery, normalizeSerial } from '../../domain/serial'
import { searchVisible } from '../../hooks/useVisibleBatteries'
import { useAuthStore } from '../../stores/authStore'

/**
 * Búsqueda global. Conserva el comportamiento directo —escribir un serial y
 * pulsar Enter abre su ficha— y añade el acceso a la paleta de comandos, que
 * es donde se resuelven las búsquedas que no son de serial.
 */
export function GlobalSearch({ onOpenPalette }: { onOpenPalette?: () => void }) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.usuarioActual)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = q.trim()
    if (!value) return
    if (isSerialQuery(value)) {
      const serial = normalizeSerial(value)
      const hits = searchVisible(serial, user)
      if (hits.length === 1) {
        navigate(`/serial/${hits[0].serial}`)
        return
      }
      if (hits.length === 0) {
        navigate(`/serial/${serial}`)
        return
      }
    }
    const hits = searchVisible(value, user)
    if (hits.length === 1) {
      navigate(`/serial/${hits[0].serial}`)
      return
    }
    navigate(`/buscar?q=${encodeURIComponent(value)}`)
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl flex-1" role="search">
      <label className="relative block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-tertiary"
          aria-hidden="true"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar CIB, documento o cliente…"
          aria-label="Búsqueda global"
          className="h-control-md w-full rounded-full border border-line bg-surface-subtle pl-10 pr-16 text-body-sm text-ink placeholder:font-sans placeholder:text-ink-tertiary transition-colors duration-fast hover:border-line-strong focus:border-viamar-400 focus:bg-white focus:shadow-focus focus:outline-none"
        />
        {/* Pista de atajo: aparece solo cuando el campo está vacío. */}
        {!q ? (
          onOpenPalette ? (
            <button
              type="button"
              onClick={onOpenPalette}
              title="Abrir paleta de comandos"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-full border border-line bg-white px-2 py-1 text-label-sm text-ink-tertiary transition-colors duration-fast hover:border-line-brand hover:text-ink lg:flex"
            >
              <Command size={11} strokeWidth={2.4} aria-hidden="true" />K
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-line px-2 py-0.5 text-label-sm text-ink-tertiary lg:block">
              Enter
            </kbd>
          )
        ) : null}
      </label>
    </form>
  )
}
