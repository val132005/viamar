import { useMemo } from 'react'
import { UBICACION_LABEL } from '../../domain/catalogs'
import { formatDate } from '../../domain/dates'
import type { UbicacionTipo } from '../../domain/entities'
import type { Bateria } from '../../domain/types'
import { useBatteryStore } from '../../stores/batteryStore'
import { useChargingStore } from '../../stores/chargingStore'
import { useDistributorStore } from '../../stores/distributorStore'
import type { FilaSerial } from './PanelWidgets'

/**
 * Filas de la tabla de seriales, ordenadas por ingreso, con el nombre de quien
 * tiene cada serial ahora —dealer, centro o cliente— y la descripción de su
 * artículo. Devuelve también los dos resolutores para reutilizarlos en rankings.
 */
export function useFilasSerial(baterias: Bateria[]) {
  const articulos = useBatteryStore((s) => s.articulos)
  const dealers = useDistributorStore((s) => s.dealers)
  const clientes = useDistributorStore((s) => s.clientes)
  const centros = useChargingStore((s) => s.centros)

  const titularDe = useMemo(() => {
    const porDealer = new Map(dealers.map((d) => [d.id, d.nombre]))
    const porCentro = new Map(centros.map((c) => [c.id, c.nombre]))
    const porCliente = new Map(clientes.map((c) => [c.id, c.nombre]))
    return (tipo: UbicacionTipo, id: string): string => {
      if (tipo === 'DEALER') return porDealer.get(id) ?? id
      if (tipo === 'CENTRO_CARGA') return porCentro.get(id) ?? id
      if (tipo === 'CLIENTE') return porCliente.get(id) ?? id
      if (tipo === 'VIAMAR') return 'Grupo Viamar'
      return '—'
    }
  }, [dealers, centros, clientes])

  const articuloDe = useMemo(() => {
    const porId = new Map(articulos.map((a) => [a.id, a.descripcion]))
    return (id: string) => porId.get(id) ?? id
  }, [articulos])

  const filas: FilaSerial[] = useMemo(
    () =>
      baterias
        .slice()
        .sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso))
        .map((b) => ({
          serial: b.serial,
          ubicacion: UBICACION_LABEL[b.ubicacionTipo] ?? b.ubicacionTipo,
          ubicacionTipo: b.ubicacionTipo,
          diagnosticoId: b.diagnosticoId,
          origen: b.origen,
          articulo: articuloDe(b.articuloId),
          titular: titularDe(b.ubicacionTipo, b.ubicacionId),
          fecha: b.fechaIngreso,
          fechaTexto: formatDate(b.fechaIngreso),
        })),
    [baterias, articuloDe, titularDe],
  )

  return { filas, titularDe, articuloDe }
}
