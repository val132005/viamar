import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { UnderlineTabs } from '../../components/panel/PanelWidgets'

const TABS = ['Cédula', 'RNC', 'Pasaporte', 'Serial'] as const
type Tab = (typeof TABS)[number]

export function CertificateLookupPage() {
  const [tab, setTab] = useState<Tab>('Serial')
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim() || 'demo'
    navigate(`/certificado/${encodeURIComponent(q)}`)
  }

  return (
    <div className="surface-raised mx-auto flex max-w-xl flex-col gap-5 p-7">
      <div className="flex items-start gap-3.5">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-viamar-100/80 text-viamar-600">
          <ShieldCheck size={23} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-headline-xl text-ink">Certificado digital de baterías</h1>
          <p className="mt-1 text-body-sm text-ink-secondary">
            Misma consulta que el portal público de grupoviamar.com/certificado: por documento del
            cliente o por serial de la batería, sin necesidad de iniciar sesión.
          </p>
        </div>
      </div>
      <UnderlineTabs
        active={tab}
        onChange={setTab}
        tabs={TABS.map((t) => ({ id: t, label: t }))}
      />
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <FormField
          label={tab}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={tab === 'Serial' ? 'CIB-90822173' : 'Documento'}
        />
        <Button type="submit" size="lg" leadingIcon={<Search size={16} />}>
          Consultar
        </Button>
      </form>
    </div>
  )
}
