import { Link } from 'react-router-dom'
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
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-headline-lg text-viamar-800">Casos de prueba del motor</h1>
        <p className="text-body-sm text-ink-secondary">
          Los mismos {rows.length} casos que Vitest. {passed}/{rows.length} ✅. Cambiar una fórmula no
          altera honras ya ejecutadas.
        </p>
        <Link to="/configuracion/politicas" className="text-label-md text-viamar-700 hover:text-viamar-link-hover">
          Volver a políticas
        </Link>
      </div>
      <div className="overflow-x-auto bg-white border border-app-border rounded">
        <table className="w-full text-body-sm">
          <thead className="bg-app-surface-alt">
            <tr>
              <th className="text-left px-3 py-2">Caso</th>
              <th className="text-left px-3 py-2">Resultado</th>
              <th className="text-left px-3 py-2">Vigencia</th>
              <th className="text-left px-3 py-2">Cliente</th>
              <th className="text-left px-3 py-2">Acredita</th>
              <th className="text-left px-3 py-2">Vitest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, r, ok }) => (
              <tr key={c.id} className="border-t border-app-border">
                <td className="px-3 py-2">{c.nombre}</td>
                <td className="px-3 py-2">{r.admisible ? 'Admisible' : r.motivoRechazo}</td>
                <td className="px-3 py-2">{r.decisionVigencia}</td>
                <td className="px-3 py-2">{usd(r.montoCliente)}</td>
                <td className="px-3 py-2">{usd(r.montoAcreditar)}</td>
                <td className="px-3 py-2">{ok ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
