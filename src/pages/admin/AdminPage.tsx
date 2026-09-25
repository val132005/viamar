import { CAPABILITIES, ROLES } from '../../domain/types'
import {
  CAPABILITY_LABEL,
  ROLE_LABEL,
  TOGGLE_HONRA_SUPERVISOR,
} from '../../domain/permissions'
import { KeyRound, RotateCcw, ShieldCheck, TriangleAlert, Users } from 'lucide-react'
import { MetricCard } from '../../components/ui/MetricCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { Ranking } from '../../components/panel/PanelWidgets'
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

  const concedidos = ROLES.reduce((a, r) => a + CAPABILITIES.filter((c) => matrix[r][c]).length, 0)
  const total = ROLES.length * CAPABILITIES.length
  const porRol = ROLES.map((r) => ({
    id: r,
    label: ROLE_LABEL[r],
    valor: CAPABILITIES.filter((c) => matrix[r][c]).length,
  })).sort((a, b) => b.valor - a.valor)

  return (
    <div className="flex flex-col gap-4 pb-2">
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

      <MetricGrid columns={4}>
        <MetricCard label="Roles" value={ROLES.length} icon={Users} tone="brand" context="Perfiles con acceso al sistema" />
        <MetricCard
          label="Capacidades"
          value={CAPABILITIES.length}
          icon={KeyRound}
          tone="accent"
          context="Acciones que se pueden conceder"
        />
        <MetricCard
          label="Permisos concedidos"
          value={concedidos}
          note={`de ${total}`}
          icon={ShieldCheck}
          tone="ok"
          context={`${Math.round((concedidos / Math.max(1, total)) * 100)}% de la matriz encendida`}
        />
        <MetricCard
          label="Decisiones pendientes"
          value={1}
          icon={TriangleAlert}
          tone="neutral"
          context="Honra por el supervisor técnico"
        />
      </MetricGrid>

      <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="surface flex min-w-0 flex-col overflow-hidden">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-4 pb-3 pt-3.5">
          <h2 className="flex items-center gap-2.5 text-headline-sm text-ink">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-viamar-50 text-viamar-600">
              <ShieldCheck size={15} aria-hidden="true" />
            </span>
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

        <div className="scroll-slim min-h-0 flex-1 overflow-auto px-4 pb-4 font-inter tracking-[-0.01em]">
          <table className="w-full border-separate border-spacing-0 text-[12px]">
            <thead>
              <tr>
                {/* La capacidad se ancla a la izquierda: al desplazar en
                    horizontal para alcanzar un rol, hay que seguir sabiendo
                    qué permiso se está concediendo. */}
                <th
                  scope="col"
                  className="sticky left-0 top-0 z-20 min-w-56 rounded-l-[4px] bg-[#f0f5fa] px-3 py-2 text-left text-[11px] font-medium text-[#1c2b42]"
                >
                  Capacidad
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    scope="col"
                    className="sticky top-0 z-10 bg-[#f0f5fa] px-2 py-2 text-center text-[11px] font-medium text-[#1c2b42] last:rounded-r-[4px]"
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
                        'sticky left-0 z-10 border-b border-[#edf1f6] px-3 py-2 text-left font-normal',
                        destacada ? 'bg-viamar-50/70' : 'bg-white group-hover/row:bg-surface-hover',
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#1c2b42]">{CAPABILITY_LABEL[cap]}</span>
                        {destacada ? <Pill tone="brand">Decisión pendiente</Pill> : null}
                      </span>
                    </th>
                    {ROLES.map((role) => (
                      <td
                        key={role}
                        className={cn(
                          'border-b border-[#edf1f6] px-2 py-2 text-center',
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

      <section className="surface px-4 pb-3 pt-3.5">
        <h2 className="text-headline-sm text-ink">Capacidades por rol</h2>
        <p className="mt-0.5 text-body-xs text-ink-tertiary">Cuántas acciones tiene encendidas cada perfil.</p>
        <div className="mt-2">
          <Ranking filas={porRol} total={concedidos} />
        </div>
      </section>
      </div>
    </div>
  )
}
