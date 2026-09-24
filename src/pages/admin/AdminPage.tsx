import { CAPABILITIES, ROLES } from '../../domain/types'
import {
  CAPABILITY_LABEL,
  ROLE_LABEL,
  TOGGLE_HONRA_SUPERVISOR,
} from '../../domain/permissions'
import { RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { PermissionToggle } from '../../components/ui/PermissionToggle'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pill } from '../../components/ui/Pill'
import { useCan, useMatrix } from '../../hooks/usePermission'
import { useConfigStore } from '../../stores/configStore'
import { useUiStore } from '../../stores/uiStore'
import { resetDemo } from '../../stores/resetDemo'
import { cn } from '../../lib/cn'

export function AdminPage() {
  const matrix = useMatrix()
  const toggle = useConfigStore((s) => s.togglePermiso)
  const resetMatriz = useConfigStore((s) => s.resetMatriz)
  const canEdit = useCan('editar_matriz')
  const canReset = useCan('reset_demo')
  const ask = useUiStore((s) => s.askConfirm)
  const toast = useUiStore((s) => s.pushToast)

  async function onReset() {
    const ok = await ask({
      title: 'Restablecer datos de demo',
      message:
        'Se descarta todo lo hecho en esta sesión —honras, diagnósticos, certificados y cambios de permisos— y los datos vuelven a su estado inicial. Se cerrará la sesión y habrá que volver a entrar.',
      confirmLabel: 'Restablecer',
      danger: true,
    })
    if (ok) resetDemo()
  }

  return (
    <div className="page-fill">
      <PageHeader
        title="Administración"
        description="Matriz de permisos editable en vivo: cada fila es una capacidad del sistema y cada columna un rol. «Ejecutar honra» para el supervisor de gestión técnica viene apagado a propósito — es una decisión de negocio pendiente."
        actions={
          <>
            {canEdit ? (
              <Button
                variant="secondary"
                leadingIcon={<RotateCcw size={15} />}
                onClick={() => {
                  resetMatriz()
                  toast('Matriz restaurada a los valores de fábrica', 'ok')
                }}
              >
                Restaurar matriz
              </Button>
            ) : null}
            {canReset ? (
              <Button
                variant="danger-quiet"
                leadingIcon={<TriangleAlert size={15} />}
                onClick={() => void onReset()}
                title="Restaura los datos de demostración a su estado inicial"
              >
                Restablecer demo
              </Button>
            ) : null}
          </>
        }
      />

      <section className="surface flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line px-3.5 py-2.5">
          <h2 className="flex items-center gap-2 text-headline-md text-ink">
            <ShieldCheck size={15} className="text-ink-tertiary" aria-hidden="true" />
            Matriz de permisos
          </h2>
          <span className="text-body-xs text-ink-tertiary">
            {CAPABILITIES.length} capacidades × {ROLES.length} roles
          </span>
          {!canEdit ? (
            <Pill tone="neutral" className="ml-auto">
              Solo lectura
            </Pill>
          ) : null}
        </header>

        <div className="scroll-slim min-h-0 flex-1 overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-body-sm">
            <thead>
              <tr>
                {/* La capacidad se ancla a la izquierda: al desplazar en
                    horizontal para alcanzar un rol, hay que seguir sabiendo
                    qué permiso se está concediendo. */}
                <th
                  scope="col"
                  className="sticky left-0 top-0 z-20 min-w-56 border-b border-line bg-surface-subtle px-3.5 py-2 text-left text-label-md font-semibold text-ink-secondary"
                >
                  Capacidad
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    scope="col"
                    className="sticky top-0 z-10 border-b border-line bg-surface-subtle px-2 py-2 text-center text-label-md font-semibold text-ink-secondary"
                  >
                    {ROLE_LABEL[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((cap) => {
                const destacada = cap === TOGGLE_HONRA_SUPERVISOR.capability
                return (
                  <tr key={cap} className="group/row">
                    <th
                      scope="row"
                      className={cn(
                        'sticky left-0 z-10 border-b border-line-subtle px-3.5 py-2 text-left font-normal',
                        destacada ? 'bg-viamar-50/70' : 'bg-white group-hover/row:bg-surface-hover',
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-label-lg text-ink">{CAPABILITY_LABEL[cap]}</span>
                        {destacada ? <Pill tone="brand">Decisión pendiente</Pill> : null}
                      </span>
                    </th>
                    {ROLES.map((role) => (
                      <td
                        key={role}
                        className={cn(
                          'border-b border-line-subtle px-2 py-2 text-center',
                          destacada ? 'bg-viamar-50/70' : 'group-hover/row:bg-surface-hover',
                        )}
                      >
                        <PermissionToggle
                          checked={matrix[role][cap]}
                          label={`${CAPABILITY_LABEL[cap]} · ${ROLE_LABEL[role]}`}
                          disabled={!canEdit}
                          hint={
                            role === TOGGLE_HONRA_SUPERVISOR.role && destacada
                              ? 'Apagado por defecto: hoy la honra la ejecuta Ventas / Garantías. Encenderlo habilita también al supervisor de gestión técnica.'
                              : undefined
                          }
                          onChange={() => toggle(role, cap)}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
