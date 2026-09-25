import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wizard, WizardStepPanel } from '../../components/ui/Wizard'
import { PageHeader } from '../../components/ui/PageHeader'
import { SegmentedControl } from '../../components/ui/FilterBar'
import { FormField } from '../../components/ui/FormField'
import { IntegrationCard } from '../../components/ui/IntegrationCard'
import { HONRA_FULL_SERIAL, HONRA_PRORRA_SERIAL } from '../../domain/entities'
import { formatDate } from '../../domain/dates'
import { usd } from '../../domain/money'
import { normalizeSerial } from '../../domain/serial'
import { evaluarSerial, ejecutarHonra } from '../../stores/actions/honra'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useUiStore } from '../../stores/uiStore'

const STEPS = [
  { id: 'serial', title: 'Serial' },
  { id: 'cert', title: 'Certificado' },
  { id: 'calculo', title: 'Cálculo' },
  { id: 'dtc', title: 'DTC / ACES' },
  { id: 'rma', title: 'RMA + NC' },
  { id: 'reemplazo', title: 'Reemplazo' },
]

export function HonraWizardPage() {
  const [step, setStep] = useState(0)
  const [serial, setSerial] = useState(HONRA_FULL_SERIAL)
  const [capacidad, setCapacidad] = useState('80')
  const [dtc, setDtc] = useState('')
  const navigate = useNavigate()
  const toast = useUiStore((s) => s.pushToast)
  const ask = useUiStore((s) => s.askConfirm)
  const norm = normalizeSerial(serial)
  const bateria = useBatteryStore((s) => s.baterias[norm])
  const articulo = useBatteryStore((s) => s.articulos.find((a) => a.id === bateria?.articuloId))
  const certs = useCertificateStore((s) => s.certificados)
  const cert = useMemo(() => certs.filter((c) => c.serial === norm).slice(-1)[0], [certs, norm])
  const evaluacion = useMemo(
    () => (bateria ? evaluarSerial(norm, { capacidadMedida: Number(capacidad) || 0 }) : { error: 'Serial no encontrado' }),
    [bateria, norm, capacidad],
  )

  function blockReason(fromStep: number): string | null {
    if (fromStep === 0 && !bateria) return 'El serial no existe.'
    if (fromStep >= 1 && (!cert || cert.estado !== 'E')) {
      return cert?.estado === 'C'
        ? 'CERT-C (cancelado) no habilita honra.'
        : 'Se requiere certificado E vigente.'
    }
    if (fromStep >= 2 && !('error' in evaluacion) && !evaluacion.admisible) {
      return evaluacion.motivoRechazo ?? 'Reclamo no admisible.'
    }
    if (fromStep >= 2 && 'error' in evaluacion) return evaluacion.error
    return null
  }

  async function finish() {
    const reason = blockReason(2)
    if (reason) {
      toast(reason, 'warn')
      return
    }
    if ('error' in evaluacion || !evaluacion.admisible) return
    const ok = await ask({
      title: 'Confirmar honra',
      message: `Vigencia ${evaluacion.decisionVigencia}. Cliente paga ${usd(evaluacion.montoCliente)}. Se cancela el certificado actual y se emite uno nuevo.`,
      confirmLabel: 'Ejecutar honra',
    })
    if (!ok) return
    const res = ejecutarHonra({
      serial: norm,
      capacidadMedida: Number(capacidad) || 0,
      origen: 'mostrador',
      dtc,
    })
    if (!res.ok) {
      toast(res.error, 'error')
      return
    }
    toast(`Honra ejecutada. Reemplazo ${res.reemplazo}`, 'ok')
    navigate(`/serial/${res.reemplazo}`)
  }

  function goNext() {
    if (step === STEPS.length - 1) {
      void finish()
      return
    }
    const reason = blockReason(step)
    if (reason) {
      toast(reason, 'warn')
      return
    }
    setStep((s) => s + 1)
  }

  const payloads =
    'error' in evaluacion
      ? []
      : [
          { verb: 'RMA.CREAR', payload: { serial: norm, motivo: 'PARA_GARANTIA' } },
          { verb: 'NOTA_CREDITO.EMITIR', payload: { ncf: cert?.facturaNcf, montoUsd: evaluacion.montoAcreditar } },
          { verb: 'MOVIMIENTO_INVENTARIO.REGISTRAR', payload: { origen: norm, destino: '(serial nuevo al confirmar)' } },
          { verb: 'RECLAMO_FABRICANTE.CREAR', payload: { serial: norm, montoUsd: evaluacion.montoAcreditar } },
        ]

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeader
        breadcrumbs={[{ label: 'Honras de garantía', to: '/honras' }, { label: 'Nueva honra de mostrador' }]}
        title="Honra de mostrador"
        description="Asistente irreversible hacia adelante. Use un serial con CERT-E: full hereda, prorrateo resetea."
        actions={
          <SegmentedControl
            value={norm === HONRA_PRORRA_SERIAL ? 'prorrateo' : norm === HONRA_FULL_SERIAL ? 'full' : ('otro' as string)}
            onChange={(id) => {
              setSerial(id === 'prorrateo' ? HONRA_PRORRA_SERIAL : HONRA_FULL_SERIAL)
              setStep(0)
            }}
            options={[
              { id: 'full', label: `Caso full · ${HONRA_FULL_SERIAL}` },
              { id: 'prorrateo', label: `Caso prorrateo · ${HONRA_PRORRA_SERIAL}` },
            ]}
          />
        }
      />
      <Wizard
        steps={STEPS}
        current={step}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={goNext}
        nextLabel={step === STEPS.length - 1 ? 'Confirmar' : 'Siguiente'}
      >
        {step === 0 && (
          <WizardStepPanel
            title="Serial"
            description="Debe existir en el inventario. La capacidad alimenta el umbral de admisibilidad (WI #2933)."
          >
            <FormField label="Serial" value={serial} onChange={(e) => setSerial(e.target.value)} className="font-code-serial" />
            <FormField
              label="Capacidad medida (%)"
              type="number"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
            />
            {articulo ? (
              <p className="flex items-center gap-2 rounded-lg border border-[#e6edf5] bg-[#f7fafd] px-3 py-2 text-body-sm text-ink">
                <span className="font-semibold">{articulo.descripcion}</span>
                <span className="text-ink-tertiary">·</span>
                {usd(articulo.precioVigente)}
              </p>
            ) : (
              <p className="text-body-sm text-danger">Serial no encontrado</p>
            )}
          </WizardStepPanel>
        )}
        {step === 1 && (
          <WizardStepPanel title="Certificado" description="El FDD exige venta y certificado vigente antes de calcular.">
            {cert ? (
              <dl className="grid max-w-xl grid-cols-[160px_1fr] gap-x-3 gap-y-2.5 rounded-xl border border-[#e6edf5] bg-[#f7fafd] px-4 py-3 text-body-sm">
                <dt className="text-ink-tertiary">Estado</dt>
                <dd className={cert.estado === 'E' ? 'text-ok font-semibold' : 'text-danger font-semibold'}>
                  CERT-{cert.estado}
                  {cert.estado === 'C' ? ' · Cancelado — no habilita honra' : ''}
                </dd>
                <dt className="text-ink-tertiary">Venta</dt>
                <dd>{formatDate(cert.fechaVenta)}</dd>
                <dt className="text-ink-tertiary">NCF</dt>
                <dd>{cert.facturaNcf}</dd>
                <dt className="text-ink-tertiary">Vehículo</dt>
                <dd>
                  {cert.vehiculo.marca} {cert.vehiculo.modelo} {cert.vehiculo.anio}
                </dd>
              </dl>
            ) : (
              <p className="text-body-sm text-danger">Sin certificado — el motor rechazará (NO_CERTIFICADO).</p>
            )}
          </WizardStepPanel>
        )}
        {step === 2 && (
          <WizardStepPanel title="Cálculo" description="Admisibilidad → meses calendario → monto → vigencia (WI #2926).">
            {'error' in evaluacion ? (
              <p className="text-danger">{evaluacion.error}</p>
            ) : !evaluacion.admisible ? (
              <p className="rounded-xl border border-critical-border/60 bg-gradient-to-br from-critical-soft/40 to-critical-soft/80 px-4 py-3 text-body-sm text-critical-text">
                Rechazado: {evaluacion.motivoRechazo}. No se calcula monto.
              </p>
            ) : (
              <>
                <div
                  className={
                    evaluacion.decisionVigencia === 'HEREDA'
                      ? 'rounded-xl border border-viamar-200 bg-gradient-to-br from-white to-viamar-50 px-4 py-3'
                      : 'rounded-xl border border-info-border/70 bg-gradient-to-br from-white to-info-soft/70 px-4 py-3'
                  }
                >
                  <p className="text-overline uppercase text-ink-tertiary">Vigencia del reemplazo</p>
                  <p className="text-metric-lg text-viamar-600">{evaluacion.decisionVigencia}</p>
                  <p className="text-body-sm mt-1">
                    {evaluacion.decisionVigencia === 'HEREDA'
                      ? 'Cliente no paga. El certificado nuevo conserva la fecha de activación original.'
                      : 'Cliente paga el proporcional. La garantía se resetea desde hoy.'}
                  </p>
                  {evaluacion.fechaActivacionReemplazo ? (
                    <p className="text-body-sm text-ink-secondary mt-1">
                      Activación: {formatDate(evaluacion.fechaActivacionReemplazo)} · fin full:{' '}
                      {evaluacion.fechaFinFullReemplazo ? formatDate(evaluacion.fechaFinFullReemplazo) : '—'}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { l: 'Meses de uso', v: String(evaluacion.mesesUso) },
                    { l: 'Acredita Viamar', v: usd(evaluacion.montoAcreditar) },
                    { l: 'Paga el cliente', v: usd(evaluacion.montoCliente) },
                  ].map((d) => (
                    <div key={d.l} className="rounded-xl border border-line bg-white px-4 py-3 shadow-xs">
                      <p className="text-body-xs text-ink-secondary">{d.l}</p>
                      <p className="mt-1 text-metric tabular-nums text-ink">{d.v}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </WizardStepPanel>
        )}
        {step === 3 && (
          <WizardStepPanel title="DTC / ACES" description="Códigos de diagnóstico del vehículo, opcionales en el prototipo.">
            <FormField
              label="DTC / ACES"
              value={dtc}
              onChange={(e) => setDtc(e.target.value)}
              placeholder="P0562 · sistema de carga"
            />
          </WizardStepPanel>
        )}
        {step === 4 && (
          <WizardStepPanel title="Salida hacia D365FO" description="Cuatro verbos, no treinta. Pendientes hasta confirmar.">
            <div className="grid md:grid-cols-2 gap-3">
              {payloads.map((p) => (
                <IntegrationCard
                  key={p.verb}
                  verb={p.verb}
                  payload={JSON.stringify(p.payload, null, 2)}
                  estado="pendiente"
                />
              ))}
            </div>
          </WizardStepPanel>
        )}
        {step === 5 && (
          <WizardStepPanel
            title="Reemplazo"
            description="Al confirmar se genera el serial nuevo, se cancela CERT-E y se escribe el timeline."
          >
            {'error' in evaluacion || !evaluacion.admisible ? (
              <p className="text-danger">No se puede confirmar: el cálculo no es admisible.</p>
            ) : (
              <ul className="list-disc space-y-1.5 rounded-xl border border-[#e6edf5] bg-[#f7fafd] py-3 pl-8 pr-4 text-body-sm">
                <li>Serial original {norm} pasa a retirada.</li>
                <li>Certificado actual → CERT-C (cancelado).</li>
                <li>
                  Reemplazo con vigencia <strong>{evaluacion.decisionVigencia}</strong>
                  {evaluacion.decisionVigencia === 'HEREDA' ? ' (misma activación)' : ' (nueva desde hoy)'}.
                </li>
                <li>Cliente paga {usd(evaluacion.montoCliente)}.</li>
              </ul>
            )}
            <p className="text-body-sm">
              Ficha actual:{' '}
              <Link className="font-semibold text-viamar-500 hover:underline" to={`/serial/${norm}`}>
                {norm}
              </Link>
            </p>
          </WizardStepPanel>
        )}
      </Wizard>
    </div>
  )
}
