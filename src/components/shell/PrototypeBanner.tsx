/**
 * Aviso de entorno. Es información de sistema, no un elemento de marca: se
 * mantiene discreto para no competir con el contenido de trabajo.
 */
export function PrototypeBanner() {
  return (
    <div className="flex h-6 shrink-0 items-center gap-2 border-b border-warning-border bg-warning-soft px-4 lg:px-6">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
      <p className="truncate text-body-xs text-warning-text">
        Entorno de prototipo · datos de demostración, sin integración real con D365FO.
      </p>
    </div>
  )
}
