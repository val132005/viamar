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
        'Se borran cuentas, permisos y cualquier dato persistido. La siguiente fase (F1) volverá a sembrar el inventario.',
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
            Matriz editable. El interruptor ⚙️ de honra del supervisor viene apagado (discusión
            Álvaro / Andree).
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
                          ? 'Apagado por defecto. Encender en vivo ante Hernán.'
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
