import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { EmptyState } from './EmptyState'

export type Column<T> = {
  key: string
  header: string
  className?: string
  render?: (row: T) => ReactNode
}

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyTitle?: string
  emptyDescription?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = 'Sin registros',
  emptyDescription = 'No hay información para mostrar con los filtros actuales.',
}: Props<T>) {
  if (rows.length === 0) {
    return <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
  }
  return (
    <div className="overflow-x-auto bg-white border border-app-border rounded">
      <table className="w-full text-body-sm">
        <thead className="bg-app-surface-alt text-ink-secondary text-label-md">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`text-left px-3 py-2 border-b border-app-border-strong ${c.className ?? ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-viamar-50">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 border-b border-app-border">
                  {c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
