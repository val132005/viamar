import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import { isSerialQuery, normalizeSerial } from '../../domain/serial'
import { searchVisible } from '../../hooks/useVisibleBatteries'
import { useAuthStore } from '../../stores/authStore'

export function GlobalSearch() {
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
    <form onSubmit={onSubmit} className="flex-1 max-w-xl">
      <label className="relative block">
        <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escanear o escribir CIB, documento o nombre…"
          className="h-10 w-full pl-9 pr-3 rounded border border-app-border-strong bg-white font-code-serial text-[13px]"
        />
      </label>
    </form>
  )
}
