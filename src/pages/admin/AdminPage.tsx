import { CAPABILITIES, ROLES } from '../../domain/types'
import {
  CAPABILITY_LABEL,
  ROLE_LABEL,
  TOGGLE_HONRA_SUPERVISOR,
} from '../../domain/permissions'
import { PermissionToggle } from '../../components/ui/PermissionToggle'
import { Button } from '../../components/ui/Button'
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-headline-lg text-viamar-800">Administración</h1>
          <p className="text-body-sm text-ink-secondary">
            Matriz editable en vivo. El interruptor ⚙️ de «Ejecutar honra» para el supervisor de
            gestión técnica viene apagado: es una decisión de negocio pendiente y se puede cambiar
            aquí mismo.
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <Button
              variant="outlined"
              onClick={() => {
                resetMatriz()
                toast('Matriz restaurada a los valores de fábrica', 'ok')
              }}
            >
              Restaurar matriz
            </Button>
          ) : null}
          {canReset ? (
            <Button variant="danger" onClick={() => void onReset()}>
              Restablecer demo
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto bg-white border border-app-border rounded">
        <table className="w-full text-body-sm">
          <thead className="bg-app-surface-alt">
            <tr>
              <th className="text-left px-3 py-2 border-b border-app-border-strong min-w-52">
                Capacidad
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className="px-2 py-2 border-b border-app-border-strong text-label-sm text-ink-secondary"
                >
                  {ROLE_LABEL[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAPABILITIES.map((cap) => (
              <tr
                key={cap}
                className={cn(
                  'hover:bg-viamar-50',
                  cap === TOGGLE_HONRA_SUPERVISOR.capability && 'bg-viamar-50/60',
                )}
              >
                <td className="px-3 py-2 border-b border-app-border">
                  {CAPABILITY_LABEL[cap]}
                  {cap === TOGGLE_HONRA_SUPERVISOR.capability ? (
                    <span className="ml-2 text-label-sm text-viamar-700">⚙️ demo</span>
                  ) : null}
                </td>
                {ROLES.map((role) => (
                  <td key={role} className="px-2 py-2 border-b border-app-border text-center">
                    <PermissionToggle
                      checked={matrix[role][cap]}
                      label={`${CAPABILITY_LABEL[cap]} · ${ROLE_LABEL[role]}`}
                      disabled={!canEdit}
                      hint={
                        role === TOGGLE_HONRA_SUPERVISOR.role &&
                        cap === TOGGLE_HONRA_SUPERVISOR.capability
                          ? 'Apagado por defecto: hoy la honra la ejecuta Ventas / Garantías. Encenderlo habilita también al supervisor de gestión técnica.'
                          : undefined
                      }
                      onChange={() => toggle(role, cap)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
