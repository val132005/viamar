import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { cn } from '../../lib/cn'

const TABS = ['Cédula', 'RNC', 'Pasaporte', 'Serial'] as const

export function CertificateLookupPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Serial')
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim() || 'demo'
    navigate(`/certificado/${encodeURIComponent(q)}`)
  }

  return (
    <div className="max-w-xl mx-auto bg-white border border-app-border rounded p-6 flex flex-col gap-4">
      <h1 className="text-headline-lg text-viamar-800">Certificado digital de baterías</h1>
      <p className="text-body-sm text-ink-secondary">
        Misma consulta que el portal público de grupoviamar.com/certificado: por documento del
        cliente o por serial de la batería, sin necesidad de iniciar sesión.
      </p>
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'h-9 px-3 rounded text-label-md',
              tab === t ? 'bg-viamar-500 text-white' : 'bg-app-bg hover:bg-viamar-50',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <FormField
          label={tab}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={tab === 'Serial' ? 'CIB-90822173' : 'Documento'}
          className={tab === 'Serial' ? 'font-code-serial' : undefined}
        />
        <Button type="submit">Consultar</Button>
      </form>
    </div>
  )
}
