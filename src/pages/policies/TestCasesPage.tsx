import { Link } from 'react-router-dom'
import { ArrowLeft, CircleCheck, CircleX } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pill, StatusDot } from '../../components/ui/Pill'
import { Button } from '../../components/ui/Button'
import { humanizeEstado, vigenciaLabel, vigenciaTone } from '../../domain/estados'
import { usd } from '../../domain/money'
import { evaluarHonra } from '../../domain/warranty/engine'
import { WARRANTY_CASES } from '../../domain/warranty/testCases'

export function TestCasesPage() {
  const rows = WARRANTY_CASES.map((c) => {
    const r = evaluarHonra(c.input)
    const ok =
      r.admisible === c.expect.admisible &&
      (c.expect.motivoRechazo ? r.motivoRechazo === c.expect.motivoRechazo : true) &&
      (c.expect.decisionVigencia ? r.decisionVigencia === c.expect.decisionVigencia : true) &&
      (c.expect.mesesUso !== undefined ? r.mesesUso === c.expect.mesesUso : true) &&
      (c.expect.montoCliente !== undefined ? r.montoCliente === c.expect.montoCliente : true)
    return { c, r, ok }
  })
  const passed = rows.filter((x) => x.ok).length
  const allPassed = passed === rows.length

  return (
    <div className="page-fill">
      <PageHeader
        breadcrumbs={[
          { label: 'Políticas y fórmulas', to: '/configuracion/politicas' },
          { label: 'Casos de prueba' },
        ]}
        title="Casos de prueba del motor"
        description="Los mismos casos que ejecuta Vitest. Cambiar una fórmula no altera honras ya ejecutadas."
        chips={
          <Pill tone={allPassed ? 'ok' : 'danger'} dot>
            {passed}/{rows.length} correctos
          </Pill>
        }
        actions={
          <Link to="/configuracion/politicas">
            <Button variant="secondary" leadingIcon={<ArrowLeft size={15} />}>
              Volver a políticas
            </Button>
          </Link>
        }
      />

      <DataTable
        density="default"
        columns={[
          { key: 'caso', header: 'Caso', primary: true, render: ({ c }) => c.nombre },
          {
            key: 'resultado',
            header: 'Resultado',
            width: '170px',
            render: ({ r }) =>
              r.admisible ? (
                <span className="inline-flex items-center gap-1.5 text-ink">
                  <StatusDot tone="ok" />
                  Admisible
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-ink">
                  <StatusDot tone="danger" />
                  {/* El motivo llega como enum del motor; no debe verse crudo. */}
                  {humanizeEstado(r.motivoRechazo ?? 'No admisible')}
                </span>
              ),
          },
          {
            key: 'vigencia',
            header: 'Vigencia',
            width: '130px',
            render: ({ r }) => (
              <Pill tone={vigenciaTone(r.decisionVigencia)}>
                {vigenciaLabel(r.decisionVigencia)}
              </Pill>
            ),
          },
          {
            key: 'cliente',
            header: 'Paga cliente',
            align: 'right',
            width: '120px',
            render: ({ r }) => usd(r.montoCliente),
          },
          {
            key: 'acredita',
            header: 'Acredita',
            align: 'right',
            width: '120px',
            render: ({ r }) => <span className="text-ink">{usd(r.montoAcreditar)}</span>,
          },
          {
            key: 'vitest',
            header: 'Vitest',
            align: 'right',
            width: '90px',
            render: ({ ok }) =>
              ok ? (
                <CircleCheck
                  size={16}
                  className="inline text-success"
                  aria-label="Coincide con Vitest"
                />
              ) : (
                <CircleX size={16} className="inline text-critical" aria-label="No coincide" />
              ),
          },
        ]}
        rows={rows}
        rowKey={({ c }) => c.id}
        rowTone={({ ok }) => (ok ? 'default' : 'danger')}
        emptyTitle="Sin casos"
        emptyDescription="El motor no tiene casos de prueba registrados."
      />
    </div>
  )
}
