import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { isSerialQuery, normalizeSerial } from '../../domain/serial'
import { searchVisible } from '../../hooks/useVisibleBatteries'
import { useAuthStore } from '../../stores/authStore'

/**
 * Búsqueda global: escribir un serial y pulsar Enter abre su ficha; cualquier
 * otro texto lleva a la búsqueda completa. La pista Ctrl + K abre la paleta
 * de comandos.
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
    <form onSubmit={onSubmit} className="max-w-[445px] flex-1" role="search">
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
          className="h-[34px] w-full rounded-[7px] border border-[#d6e0ec] bg-[#f8fafd] pl-10 pr-20 text-body-sm text-ink placeholder:font-sans placeholder:text-[#8591a3] transition-colors duration-fast hover:border-line-strong focus:border-viamar-400 focus:bg-white focus:shadow-focus focus:outline-none"
        />
        {!q && onOpenPalette ? (
          <button
            type="button"
            onClick={onOpenPalette}
            title="Abrir paleta de comandos"
            className="absolute right-2 top-1/2 hidden h-[19px] -translate-y-1/2 items-center rounded-[4px] bg-[#e9eef5] px-2 text-[11px] text-[#6a788c] transition-colors duration-fast hover:bg-[#dde4ee] hover:text-ink lg:inline-flex"
          >
            Ctrl + K
          </button>
        ) : null}
      </label>
    </form>
  )
}
