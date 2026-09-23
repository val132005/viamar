import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wizard, WizardStepPanel } from '../../components/ui/Wizard'
import { Button } from '../../components/ui/Button'
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
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-headline-lg text-viamar-800">Honra de mostrador</h1>
        <p className="text-body-sm text-ink-secondary">
          Wizard irreversible hacia adelante. Use un serial con CERT-E: full hereda, prorrateo resetea.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={norm === HONRA_FULL_SERIAL ? 'primary' : 'outlined'}
          className="h-8 text-label-md"
          onClick={() => {
            setSerial(HONRA_FULL_SERIAL)
            setStep(0)
          }}
        >
          Caso full · {HONRA_FULL_SERIAL}
        </Button>
        <Button
          variant={norm === HONRA_PRORRA_SERIAL ? 'primary' : 'outlined'}
          className="h-8 text-label-md"
          onClick={() => {
            setSerial(HONRA_PRORRA_SERIAL)
            setStep(0)
          }}
        >
          Caso prorrateo · {HONRA_PRORRA_SERIAL}
        </Button>
      </div>
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
              <p className="text-body-sm">
                {articulo.descripcion} · {usd(articulo.precioVigente)}
              </p>
            ) : (
              <p className="text-body-sm text-danger">Serial no encontrado</p>
            )}
          </WizardStepPanel>
        )}
        {step === 1 && (
          <WizardStepPanel title="Certificado" description="El FDD exige venta y certificado vigente antes de calcular.">
            {cert ? (
              <dl className="grid grid-cols-2 gap-2 text-body-sm">
                <dt className="text-ink-secondary">Estado</dt>
                <dd className={cert.estado === 'E' ? 'text-ok font-semibold' : 'text-danger font-semibold'}>
                  CERT-{cert.estado}
                  {cert.estado === 'C' ? ' · Cancelado — no habilita honra' : ''}
                </dd>
                <dt className="text-ink-secondary">Venta</dt>
                <dd>{formatDate(cert.fechaVenta)}</dd>
                <dt className="text-ink-secondary">NCF</dt>
                <dd>{cert.facturaNcf}</dd>
                <dt className="text-ink-secondary">Vehículo</dt>
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
              <p className="rounded bg-danger/10 p-3 text-body-sm text-danger">
                Rechazado: {evaluacion.motivoRechazo}. No se calcula monto.
              </p>
            ) : (
              <>
                <div
                  className={
                    evaluacion.decisionVigencia === 'HEREDA'
                      ? 'rounded bg-viamar-50 p-3'
                      : 'rounded bg-app-surface-alt p-3'
                  }
                >
                  <p className="text-label-sm uppercase text-viamar-800">Vigencia del reemplazo</p>
                  <p className="text-headline-lg text-viamar-700">{evaluacion.decisionVigencia}</p>
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
                <dl className="grid grid-cols-2 gap-2 text-body-sm">
                  <dt className="text-ink-secondary">Meses de uso</dt>
                  <dd>{evaluacion.mesesUso}</dd>
                  <dt className="text-ink-secondary">Acreditar</dt>
                  <dd>{usd(evaluacion.montoAcreditar)}</dd>
                  <dt className="text-ink-secondary">Paga el cliente</dt>
                  <dd className="font-semibold">{usd(evaluacion.montoCliente)}</dd>
                </dl>
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
              <ul className="text-body-sm list-disc pl-5 space-y-1">
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
              <Link className="text-viamar-700 font-code-serial" to={`/serial/${norm}`}>
                {norm}
              </Link>
            </p>
          </WizardStepPanel>
        )}
      </Wizard>
    </div>
  )
}
