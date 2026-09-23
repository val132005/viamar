import { buildSeed } from '../seed/buildSeed'
import { useBatteryStore } from './batteryStore'
import { useCertificateStore } from './certificateStore'
import { useChargingStore } from './chargingStore'
import { useConfigStore } from './configStore'
import { useDistributorStore } from './distributorStore'
import { useHistoryStore } from './historyStore'
import { useInspectionStore } from './inspectionStore'
import { useIntegrationStore } from './integrationStore'
import { useWarrantyStore } from './warrantyStore'

const DOMAIN_STORES = [
  useBatteryStore,
  useCertificateStore,
  useChargingStore,
  useConfigStore,
  useDistributorStore,
  useHistoryStore,
  useInspectionStore,
  useIntegrationStore,
  useWarrantyStore,
] as const

export function applySeed(seed = buildSeed(new Date())) {
  useBatteryStore.getState().load({
    baterias: seed.baterias,
    articulos: seed.articulos,
    marcas: seed.marcas,
  })
  useDistributorStore.getState().load({ dealers: seed.dealers, clientes: seed.clientes })
  useCertificateStore.getState().load(seed.certificados)
  useInspectionStore.getState().load(seed.solicitudes)
  useChargingStore.getState().load({
    procesos: seed.procesos,
    centros: seed.centros,
    estaciones: seed.estaciones,
  })
  useWarrantyStore.getState().load({
    honras: seed.honras,
    reclamosFabricante: seed.reclamosFabricante,
  })
  useHistoryStore.getState().load(seed.eventos)
  useIntegrationStore.getState().load(seed.integracion)
  useConfigStore.getState().loadMaestros({
    politicas: seed.politicas,
    formulas: seed.formulas,
    tiposUso: seed.tiposUso,
  })
}

function isEmpty() {
  return Object.keys(useBatteryStore.getState().baterias).length === 0
}

function whenHydrated(store: { persist?: { hasHydrated?: () => boolean; onFinishHydration?: (cb: () => void) => () => void } }) {
  return new Promise<void>((resolve) => {
    const api = store.persist
    if (!api?.hasHydrated || api.hasHydrated()) {
      resolve()
      return
    }
    const unsub = api.onFinishHydration?.(() => {
      unsub?.()
      resolve()
    })
    window.setTimeout(() => resolve(), 400)
  })
}

export async function ensureSeed() {
  await Promise.all(DOMAIN_STORES.map((s) => whenHydrated(s)))
  if (isEmpty()) applySeed()
}
