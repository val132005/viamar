import { useState } from 'react'
import { Building2, Car, Package, Pencil, PlugZap, Plus, Tags, Trash2 } from 'lucide-react'
import { MetricCard } from '../../components/ui/MetricCard'
import { MetricGrid } from '../../components/ui/Workspace'
import { Button } from '../../components/ui/Button'
import { DataTable, CellStack, type RowAction } from '../../components/ui/DataTable'
import { FormField, SelectField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageTabs } from '../../components/ui/PageTabs'
import { usd } from '../../domain/money'
import type {
  Articulo,
  CentroCarga,
  Dealer,
  DealerPerfil,
  Estacion,
  Marca,
  TipoUso,
} from '../../domain/entities'
import { useBatteryStore } from '../../stores/batteryStore'
import { useCertificateStore } from '../../stores/certificateStore'
import { useChargingStore } from '../../stores/chargingStore'
import { useConfigStore } from '../../stores/configStore'
import { useDistributorStore } from '../../stores/distributorStore'
import { useInspectionStore } from '../../stores/inspectionStore'
import { useUiStore } from '../../stores/uiStore'

type SeccionId = 'articulos' | 'marcas' | 'dealers' | 'centros' | 'tipos'

/**
 * Navegación entre maestros. Antes las seis tablas se apilaban en un scroll
 * único; separarlas deja cada una a pantalla completa y evita que el usuario
 * tenga que recorrer la página entera para llegar a la última.
 */
const SECCIONES: Array<{ id: SeccionId; label: string }> = [
  { id: 'articulos', label: 'Artículos' },
  { id: 'marcas', label: 'Marcas' },
  { id: 'dealers', label: 'Distribuidores' },
  { id: 'centros', label: 'Centros y estaciones' },
  { id: 'tipos', label: 'Tipos de uso' },
]

/**
 * Acciones de fila. Se devuelven como descriptores para que la tabla las
 * muestre al pasar por encima: mantenerlas siempre visibles llenaba la vista
 * de botones y daba a «Eliminar» el mismo peso que a «Editar».
 */
function rowActions<T>(onEdit: (row: T) => void, onDelete: (row: T) => void): RowAction<T>[] {
  return [
    { id: 'edit', label: 'Editar', icon: <Pencil size={14} />, onClick: onEdit },
    { id: 'delete', label: 'Eliminar', icon: <Trash2 size={14} />, onClick: onDelete, tone: 'danger' },
  ]
}

function slug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function MaestrosPage() {
  const ask = useUiStore((s) => s.askConfirm)
  const toast = useUiStore((s) => s.pushToast)

  const articulos = useBatteryStore((s) => s.articulos)
  const marcas = useBatteryStore((s) => s.marcas)
  const baterias = useBatteryStore((s) => s.baterias)
  const upsertArticulo = useBatteryStore((s) => s.upsertArticulo)
  const removeArticulo = useBatteryStore((s) => s.removeArticulo)
  const upsertMarca = useBatteryStore((s) => s.upsertMarca)
  const removeMarca = useBatteryStore((s) => s.removeMarca)

  const dealers = useDistributorStore((s) => s.dealers)
  const upsertDealer = useDistributorStore((s) => s.upsertDealer)
  const removeDealer = useDistributorStore((s) => s.removeDealer)

  const centros = useChargingStore((s) => s.centros)
  const estaciones = useChargingStore((s) => s.estaciones)
  const procesos = useChargingStore((s) => s.procesos)
  const upsertCentro = useChargingStore((s) => s.upsertCentro)
  const removeCentro = useChargingStore((s) => s.removeCentro)
  const upsertEstacion = useChargingStore((s) => s.upsertEstacion)
  const removeEstacion = useChargingStore((s) => s.removeEstacion)

  const tipos = useConfigStore((s) => s.tiposUso)
  const politicas = useConfigStore((s) => s.politicas)
  const upsertTipoUso = useConfigStore((s) => s.upsertTipoUso)
  const removeTipoUso = useConfigStore((s) => s.removeTipoUso)

  const certificados = useCertificateStore((s) => s.certificados)
  const solicitudes = useInspectionStore((s) => s.solicitudes)

  const politicasActivas = politicas.filter((p) => p.estado === 'ACTIVA')

  const [artForm, setArtForm] = useState<null | { editing: Articulo | null }>(null)
  const [marcaForm, setMarcaForm] = useState<null | { editing: Marca | null }>(null)
  const [dealerForm, setDealerForm] = useState<null | { editing: Dealer | null }>(null)
  const [centroForm, setCentroForm] = useState<null | { editing: CentroCarga | null }>(null)
  const [estForm, setEstForm] = useState<null | { editing: Estacion | null }>(null)
  const [tipoForm, setTipoForm] = useState<null | { editing: TipoUso | null }>(null)
  const [seccion, setSeccion] = useState<SeccionId>('articulos')
  const [q, setQ] = useState('')

  async function confirmDelete(title: string, message: string): Promise<boolean> {
    return ask({ title, message, confirmLabel: 'Eliminar', danger: true })
  }

  // ---- Artículos ----
  async function deleteArticulo(a: Articulo) {
    const usos = Object.values(baterias).filter((b) => b.articuloId === a.id).length
    if (usos > 0) {
      toast(`No se puede eliminar ${a.codigo}: ${usos} seriales lo usan.`, 'error')
      return
    }
    if (!(await confirmDelete('Eliminar artículo', `Se eliminará ${a.codigo} · ${a.descripcion}.`)))
      return
    removeArticulo(a.id)
    toast('Artículo eliminado', 'ok')
  }

  // ---- Marcas ----
  async function deleteMarca(m: Marca) {
    const usos = articulos.filter((a) => a.marcaId === m.id).length
    if (usos > 0) {
      toast(`No se puede eliminar ${m.nombre}: ${usos} artículos la usan.`, 'error')
      return
    }
    if (!(await confirmDelete('Eliminar marca', `Se eliminará la marca ${m.nombre}.`))) return
    removeMarca(m.id)
    toast('Marca eliminada', 'ok')
  }

  // ---- Dealers ----
  async function deleteDealer(d: Dealer) {
    const enBaterias = Object.values(baterias).filter(
      (b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === d.id,
    ).length
    const enCerts = certificados.filter((c) => c.dealerId === d.id).length
    const enSol = solicitudes.filter((s) => s.dealerId === d.id).length
    const total = enBaterias + enCerts + enSol
    if (total > 0) {
      toast(
        `No se puede eliminar ${d.nombre}: ${enBaterias} en inventario, ${enCerts} certificados, ${enSol} solicitudes.`,
        'error',
      )
      return
    }
    if (!(await confirmDelete('Eliminar dealer', `Se eliminará ${d.nombre}.`))) return
    removeDealer(d.id)
    toast('Dealer eliminado', 'ok')
  }

  // ---- Centros / estaciones ----
  async function deleteCentro(c: CentroCarga) {
    const est = estaciones.filter((e) => e.centroId === c.id).length
    const proc = procesos.filter((p) => p.centroId === c.id).length
    const sol = solicitudes.filter((s) => s.centroId === c.id).length
    if (est + proc + sol > 0) {
      toast(
        `No se puede eliminar ${c.nombre}: ${est} estaciones, ${proc} procesos, ${sol} solicitudes.`,
        'error',
      )
      return
    }
    if (!(await confirmDelete('Eliminar centro', `Se eliminará ${c.nombre}.`))) return
    removeCentro(c.id)
    toast('Centro eliminado', 'ok')
  }

  async function deleteEstacion(e: Estacion) {
    const proc = procesos.filter((p) => p.estacionId === e.id).length
    if (proc > 0) {
      toast(`No se puede eliminar ${e.nombre}: ${proc} procesos la usan.`, 'error')
      return
    }
    if (!(await confirmDelete('Eliminar estación', `Se eliminará ${e.nombre}.`))) return
    removeEstacion(e.id)
    toast('Estación eliminada', 'ok')
  }

  // ---- Tipos de uso ----
  async function deleteTipo(t: TipoUso) {
    const usos = certificados.filter((c) => c.tipoUsoId === t.id).length
    if (usos > 0) {
      toast(`No se puede eliminar ${t.nombre}: ${usos} certificados lo usan.`, 'error')
      return
    }
    if (!(await confirmDelete('Eliminar tipo de uso', `Se eliminará ${t.nombre}.`))) return
    removeTipoUso(t.id)
    toast('Tipo de uso eliminado', 'ok')
  }

  const counts: Record<SeccionId, number> = {
    articulos: articulos.length,
    marcas: marcas.length,
    dealers: dealers.length,
    centros: centros.length,
    tipos: tipos.length,
  }

  const needle = q.trim().toLowerCase()
  const match = (...fields: Array<string | undefined>) =>
    !needle || fields.some((f) => (f ?? '').toLowerCase().includes(needle))

  /* Centros y estaciones son dos maestros en la misma pestaña, así que ahí el
     alta se queda en la cabecera de cada tabla y no hay una única acción. */
  const ALTA: Partial<Record<SeccionId, { label: string; onClick: () => void }>> = {
    articulos: { label: 'Nuevo artículo', onClick: () => setArtForm({ editing: null }) },
    marcas: { label: 'Nueva marca', onClick: () => setMarcaForm({ editing: null }) },
    dealers: { label: 'Nuevo distribuidor', onClick: () => setDealerForm({ editing: null }) },
    tipos: { label: 'Nuevo tipo de uso', onClick: () => setTipoForm({ editing: null }) },
  }
  const alta = ALTA[seccion]
  const altaDeSeccion = alta ? (
    <Button leadingIcon={<Plus size={15} />} onClick={alta.onClick}>
      {alta.label}
    </Button>
  ) : null

  return (
    <div className="page-fill">
      <PageHeader
        title="Maestros"
        description="Catálogos que alimentan el resto de la operación: artículos, marcas, distribuidores, centros y tipos de uso."
        tabs={
          <PageTabs
            active={seccion}
            onChange={(id) => setSeccion(id as SeccionId)}
            tabs={SECCIONES.map((s) => ({ id: s.id, label: s.label, count: counts[s.id] }))}
            /* El alta vive junto a las pestañas porque depende de cuál esté
               activa: es «nuevo …de esto que estoy viendo». */
            action={altaDeSeccion}
          />
        }
      />

      <MetricGrid columns={4}>
        <MetricCard
          label="Artículos"
          value={articulos.length}
          icon={Package}
          tone="brand"
          context={`${articulos.filter((a) => a.porConfirmar).length} por confirmar precio`}
        />
        <MetricCard label="Marcas" value={marcas.length} icon={Tags} tone="accent" context="Fabricantes con catálogo activo" />
        <MetricCard
          label="Distribuidores"
          value={dealers.length}
          icon={Building2}
          tone="ok"
          context="Puntos de venta en consignación"
        />
        <MetricCard
          label="Centros y estaciones"
          value={centros.length}
          note={`· ${estaciones.length} estaciones`}
          icon={PlugZap}
          tone="neutral"
          context={`${tipos.length} tipos de uso de vehículo`}
        />
      </MetricGrid>

      {seccion === 'articulos' ? (
        <DataTable
          title="Artículos"
          search={{ value: q, onChange: setQ, placeholder: 'Código, descripción o marca…' }}
          columns={[
            {
              key: 'codigo',
              header: 'Artículo',
              primary: true,
              sortable: true,
              render: (a: Articulo) => <CellStack primary={a.codigo} secondary={a.descripcion} />,
            },
            {
              key: 'marca',
              header: 'Marca',
              sortable: true,
              width: '140px',
              sortValue: (a: Articulo) => marcas.find((m) => m.id === a.marcaId)?.nombre ?? a.marcaId,
              render: (a: Articulo) => marcas.find((m) => m.id === a.marcaId)?.nombre ?? a.marcaId,
            },
            {
              key: 'cap',
              header: 'Cap. (CCA)',
              align: 'right',
              width: '110px',
              sortable: true,
              sortValue: (a: Articulo) => a.capacidadNominal,
              render: (a: Articulo) => String(a.capacidadNominal),
            },
            {
              key: 'precio',
              header: 'Precio',
              align: 'right',
              width: '110px',
              sortable: true,
              sortValue: (a: Articulo) => a.precioVigente,
              render: (a: Articulo) => <span className="text-ink">{usd(a.precioVigente)}</span>,
            },
            {
              key: 'politica',
              header: 'Política',
              secondary: true,
              sortable: true,
              sortValue: (a: Articulo) => a.politicaId,
              render: (a: Articulo) => {
                const p = politicas.find((x) => x.id === a.politicaId && x.estado === 'ACTIVA')
                return p ? `${p.nombre} v${p.version}` : a.politicaId
              },
            },
          ]}
          rows={articulos.filter((a) =>
            match(a.codigo, a.descripcion, marcas.find((m) => m.id === a.marcaId)?.nombre),
          )}
          rowKey={(a) => a.id}
          rowActions={rowActions<Articulo>(
            (a) => setArtForm({ editing: a }),
            (a) => void deleteArticulo(a),
          )}
          emptyTitle="Sin artículos"
          emptyDescription="No hay artículos que coincidan con la búsqueda."
        />
      ) : null}

      {seccion === 'marcas' ? (
        <DataTable
          title="Marcas"
          search={{ value: q, onChange: setQ, placeholder: 'Nombre de marca…' }}
          columns={[
            { key: 'nombre', header: 'Nombre', primary: true, sortable: true },
            {
              key: 'articulos',
              header: 'Artículos',
              align: 'right',
              width: '120px',
              sortable: true,
              sortValue: (m: Marca) => articulos.filter((a) => a.marcaId === m.id).length,
              render: (m: Marca) => String(articulos.filter((a) => a.marcaId === m.id).length),
            },
            { key: 'id', header: 'Identificador', secondary: true, sortable: true },
          ]}
          rows={marcas.filter((m) => match(m.nombre, m.id))}
          rowKey={(m) => m.id}
          rowActions={rowActions<Marca>(
            (m) => setMarcaForm({ editing: m }),
            (m) => void deleteMarca(m),
          )}
          emptyTitle="Sin marcas"
          emptyDescription="No hay marcas que coincidan con la búsqueda."
        />
      ) : null}

      {seccion === 'dealers' ? (
        <DataTable
          title="Distribuidores"
          search={{ value: q, onChange: setQ, placeholder: 'Nombre, RNC o localidad…' }}
          columns={[
            {
              key: 'nombre',
              header: 'Distribuidor',
              primary: true,
              sortable: true,
              render: (d: Dealer) => <CellStack primary={d.nombre} secondary={d.rnc} />,
            },
            { key: 'localidad', header: 'Localidad', sortable: true, width: '160px' },
            {
              key: 'inventario',
              header: 'En inventario',
              align: 'right',
              width: '130px',
              sortable: true,
              sortValue: (d: Dealer) =>
                Object.values(baterias).filter(
                  (b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === d.id,
                ).length,
              render: (d: Dealer) =>
                String(
                  Object.values(baterias).filter(
                    (b) => b.ubicacionTipo === 'DEALER' && b.ubicacionId === d.id,
                  ).length,
                ),
            },
            { key: 'perfil', header: 'Perfil', secondary: true, sortable: true, width: '130px' },
          ]}
          rows={dealers.filter((d) => match(d.nombre, d.rnc, d.localidad))}
          rowKey={(d) => d.id}
          rowActions={rowActions<Dealer>(
            (d) => setDealerForm({ editing: d }),
            (d) => void deleteDealer(d),
          )}
          emptyTitle="Sin distribuidores"
          emptyDescription="No hay distribuidores que coincidan con la búsqueda."
        />
      ) : null}

      {seccion === 'centros' ? (
        /* Centro y estación son un maestro y su dependiente: se muestran uno
           junto al otro para que la relación sea evidente. */
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          <DataTable
            title="Centros de carga"
            actions={
              <Button size="sm" variant="secondary" leadingIcon={<Plus size={14} />} onClick={() => setCentroForm({ editing: null })}>
                Nuevo centro
              </Button>
            }
            columns={[
              { key: 'nombre', header: 'Centro', primary: true, sortable: true },
              { key: 'localidad', header: 'Localidad', sortable: true },
              {
                key: 'est',
                header: 'Estaciones',
                align: 'right',
                width: '110px',
                sortable: true,
                sortValue: (c: CentroCarga) => estaciones.filter((e) => e.centroId === c.id).length,
                render: (c: CentroCarga) =>
                  String(estaciones.filter((e) => e.centroId === c.id).length),
              },
            ]}
            rows={centros}
            rowKey={(c) => c.id}
            rowActions={rowActions<CentroCarga>(
              (c) => setCentroForm({ editing: c }),
              (c) => void deleteCentro(c),
            )}
            emptyTitle="Sin centros"
            emptyDescription="Aún no hay centros de carga registrados."
          />

          <DataTable
            title="Estaciones"
            actions={
              <Button size="sm" variant="secondary" leadingIcon={<Plus size={14} />} onClick={() => setEstForm({ editing: null })}>
                Nueva estación
              </Button>
            }
            columns={[
              { key: 'nombre', header: 'Estación', primary: true, sortable: true },
              {
                key: 'centro',
                header: 'Centro',
                sortable: true,
                sortValue: (e: Estacion) => centros.find((c) => c.id === e.centroId)?.nombre ?? e.centroId,
                render: (e: Estacion) =>
                  centros.find((c) => c.id === e.centroId)?.nombre ?? e.centroId,
              },
            ]}
            rows={estaciones}
            rowKey={(e) => e.id}
            rowActions={rowActions<Estacion>(
              (e) => setEstForm({ editing: e }),
              (e) => void deleteEstacion(e),
            )}
            emptyTitle="Sin estaciones"
            emptyDescription="Aún no hay estaciones registradas."
          />
        </div>
      ) : null}

      {seccion === 'tipos' ? (
        <DataTable
          title="Tipos de uso"
          search={{ value: q, onChange: setQ, placeholder: 'Tipo de uso…' }}
          columns={[
            { key: 'nombre', header: 'Nombre', primary: true, sortable: true },
            {
              key: 'veh',
              header: 'Requiere vehículo',
              width: '170px',
              sortable: true,
              sortValue: (t: TipoUso) => (t.requiereVehiculo ? 1 : 0),
              render: (t: TipoUso) => (t.requiereVehiculo ? 'Sí' : 'No'),
            },
            {
              key: 'certs',
              header: 'Certificados',
              align: 'right',
              width: '120px',
              sortable: true,
              sortValue: (t: TipoUso) => certificados.filter((c) => c.tipoUsoId === t.id).length,
              render: (t: TipoUso) =>
                String(certificados.filter((c) => c.tipoUsoId === t.id).length),
            },
            { key: 'id', header: 'Identificador', secondary: true, sortable: true },
          ]}
          rows={tipos.filter((t) => match(t.nombre, t.id))}
          rowKey={(t) => t.id}
          rowActions={rowActions<TipoUso>(
            (t) => setTipoForm({ editing: t }),
            (t) => void deleteTipo(t),
          )}
          emptyTitle="Sin tipos de uso"
          emptyDescription="No hay tipos de uso que coincidan con la búsqueda."
        />
      ) : null}

      {artForm ? (
        <ArticuloForm
          editing={artForm.editing}
          marcas={marcas}
          politicasActivas={politicasActivas.map((p) => ({ id: p.id, label: `${p.nombre} v${p.version}` }))}
          onClose={() => setArtForm(null)}
          onSave={(a) => {
            upsertArticulo(a)
            setArtForm(null)
            toast(artForm.editing ? 'Artículo actualizado' : 'Artículo creado', 'ok')
          }}
        />
      ) : null}
      {marcaForm ? (
        <MarcaForm
          editing={marcaForm.editing}
          onClose={() => setMarcaForm(null)}
          onSave={(m) => {
            upsertMarca(m)
            setMarcaForm(null)
            toast(marcaForm.editing ? 'Marca actualizada' : 'Marca creada', 'ok')
          }}
        />
      ) : null}
      {dealerForm ? (
        <DealerForm
          editing={dealerForm.editing}
          onClose={() => setDealerForm(null)}
          onSave={(d) => {
            upsertDealer(d)
            setDealerForm(null)
            toast(dealerForm.editing ? 'Dealer actualizado' : 'Dealer creado', 'ok')
          }}
        />
      ) : null}
      {centroForm ? (
        <CentroForm
          editing={centroForm.editing}
          onClose={() => setCentroForm(null)}
          onSave={(c) => {
            upsertCentro(c)
            setCentroForm(null)
            toast(centroForm.editing ? 'Centro actualizado' : 'Centro creado', 'ok')
          }}
        />
      ) : null}
      {estForm ? (
        <EstacionForm
          editing={estForm.editing}
          centros={centros}
          onClose={() => setEstForm(null)}
          onSave={(e) => {
            upsertEstacion(e)
            setEstForm(null)
            toast(estForm.editing ? 'Estación actualizada' : 'Estación creada', 'ok')
          }}
        />
      ) : null}
      {tipoForm ? (
        <TipoUsoForm
          editing={tipoForm.editing}
          onClose={() => setTipoForm(null)}
          onSave={(t) => {
            upsertTipoUso(t)
            setTipoForm(null)
            toast(tipoForm.editing ? 'Tipo de uso actualizado' : 'Tipo de uso creado', 'ok')
          }}
        />
      ) : null}
    </div>
  )
}

// ---------- Formularios ----------

function ArticuloForm({
  editing,
  marcas,
  politicasActivas,
  onClose,
  onSave,
}: {
  editing: Articulo | null
  marcas: Marca[]
  politicasActivas: { id: string; label: string }[]
  onClose: () => void
  onSave: (a: Articulo) => void
}) {
  const toast = useUiStore((s) => s.pushToast)
  const [codigo, setCodigo] = useState(editing?.codigo ?? '')
  const [descripcion, setDescripcion] = useState(editing?.descripcion ?? '')
  const [marcaId, setMarcaId] = useState(editing?.marcaId ?? marcas[0]?.id ?? '')
  const [capacidad, setCapacidad] = useState(String(editing?.capacidadNominal ?? ''))
  const [precio, setPrecio] = useState(String(editing?.precioVigente ?? ''))
  const [politicaId, setPoliticaId] = useState(editing?.politicaId ?? politicasActivas[0]?.id ?? '')

  function save() {
    if (!codigo.trim() || !descripcion.trim()) {
      toast('Código y descripción son obligatorios.', 'warn')
      return
    }
    const cap = Number(capacidad)
    const pr = Number(precio)
    if (!Number.isFinite(cap) || cap <= 0) {
      toast('Capacidad inválida (CCA > 0).', 'warn')
      return
    }
    if (!Number.isFinite(pr) || pr < 0) {
      toast('Precio inválido (USD ≥ 0).', 'warn')
      return
    }
    if (!marcaId || !politicaId) {
      toast('Seleccione marca y política.', 'warn')
      return
    }
    onSave({
      id: editing?.id ?? `art-${slug(codigo)}-${Date.now().toString(36)}`,
      codigo: codigo.trim().toUpperCase(),
      descripcion: descripcion.trim(),
      marcaId,
      capacidadNominal: cap,
      precioVigente: Math.round(pr * 100) / 100,
      politicaId,
      porConfirmar: false,
    })
  }

  return (
    <Modal
      open
      title={editing ? 'Editar artículo' : 'Nuevo artículo'}
      description="Código, marca, capacidad y precio vigente del artículo."
      icon={Package}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FormField label="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="VMX-55-700" />
        <FormField label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Viamax 55 / 700 CCA" />
        <SelectField label="Marca" value={marcaId} onChange={(e) => setMarcaId(e.target.value)}>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Capacidad (CCA)" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} inputMode="decimal" />
          <FormField label="Precio USD" value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" />
        </div>
        <SelectField label="Política asignada" value={politicaId} onChange={(e) => setPoliticaId(e.target.value)}>
          {politicasActivas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </SelectField>
      </div>
    </Modal>
  )
}

function MarcaForm({
  editing,
  onClose,
  onSave,
}: {
  editing: Marca | null
  onClose: () => void
  onSave: (m: Marca) => void
}) {
  const toast = useUiStore((s) => s.pushToast)
  const [nombre, setNombre] = useState(editing?.nombre ?? '')
  function save() {
    if (!nombre.trim()) {
      toast('El nombre es obligatorio.', 'warn')
      return
    }
    onSave({ id: editing?.id ?? slug(nombre), nombre: nombre.trim() })
  }
  return (
    <Modal
      open
      title={editing ? 'Editar marca' : 'Nueva marca'}
      icon={Tags}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar</Button>
        </>
      }
    >
      <FormField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Viamax" />
    </Modal>
  )
}

const PERFILES: DealerPerfil[] = ['envejecido', 'impecable', 'incidencias', 'normal']

function DealerForm({
  editing,
  onClose,
  onSave,
}: {
  editing: Dealer | null
  onClose: () => void
  onSave: (d: Dealer) => void
}) {
  const toast = useUiStore((s) => s.pushToast)
  const [nombre, setNombre] = useState(editing?.nombre ?? '')
  const [rnc, setRnc] = useState(editing?.rnc ?? '')
  const [localidad, setLocalidad] = useState(editing?.localidad ?? '')
  const [vendedor, setVendedor] = useState(editing?.vendedorAsignado ?? '')
  const [perfil, setPerfil] = useState<DealerPerfil>(editing?.perfil ?? 'normal')
  function save() {
    if (!nombre.trim() || !localidad.trim()) {
      toast('Nombre y localidad son obligatorios.', 'warn')
      return
    }
    onSave({
      id: editing?.id ?? `dealer-${slug(nombre)}-${Date.now().toString(36)}`,
      nombre: nombre.trim(),
      rnc: rnc.trim(),
      localidad: localidad.trim(),
      vendedorAsignado: vendedor.trim() || 'usr-fraisi',
      ultimaVisita: editing?.ultimaVisita ?? '',
      perfil,
      porConfirmar: false,
    })
  }
  return (
    <Modal
      open
      title={editing ? 'Editar dealer' : 'Nuevo dealer'}
      description="Datos del punto de venta en consignación."
      icon={Building2}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FormField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <FormField label="RNC" value={rnc} onChange={(e) => setRnc(e.target.value)} />
          <FormField label="Localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
        </div>
        <FormField label="Vendedor asignado" value={vendedor} onChange={(e) => setVendedor(e.target.value)} placeholder="usr-fraisi" />
        <SelectField label="Perfil" value={perfil} onChange={(e) => setPerfil(e.target.value as DealerPerfil)}>
          {PERFILES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </SelectField>
      </div>
    </Modal>
  )
}

function CentroForm({
  editing,
  onClose,
  onSave,
}: {
  editing: CentroCarga | null
  onClose: () => void
  onSave: (c: CentroCarga) => void
}) {
  const toast = useUiStore((s) => s.pushToast)
  const [nombre, setNombre] = useState(editing?.nombre ?? '')
  const [localidad, setLocalidad] = useState(editing?.localidad ?? '')
  function save() {
    if (!nombre.trim() || !localidad.trim()) {
      toast('Nombre y localidad son obligatorios.', 'warn')
      return
    }
    onSave({
      id: editing?.id ?? `centro-${slug(nombre)}-${Date.now().toString(36)}`,
      nombre: nombre.trim(),
      localidad: localidad.trim(),
      porConfirmar: false,
    })
  }
  return (
    <Modal
      open
      title={editing ? 'Editar centro' : 'Nuevo centro'}
      icon={PlugZap}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FormField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <FormField label="Localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
      </div>
    </Modal>
  )
}

function EstacionForm({
  editing,
  centros,
  onClose,
  onSave,
}: {
  editing: Estacion | null
  centros: CentroCarga[]
  onClose: () => void
  onSave: (e: Estacion) => void
}) {
  const toast = useUiStore((s) => s.pushToast)
  const [centroId, setCentroId] = useState(editing?.centroId ?? centros[0]?.id ?? '')
  const [nombre, setNombre] = useState(editing?.nombre ?? '')
  function save() {
    if (!centroId) {
      toast('Seleccione el centro.', 'warn')
      return
    }
    if (!nombre.trim()) {
      toast('El nombre es obligatorio.', 'warn')
      return
    }
    onSave({
      id: editing?.id ?? `${centroId}-e${Date.now().toString(36)}`,
      centroId,
      nombre: nombre.trim(),
    })
  }
  return (
    <Modal
      open
      title={editing ? 'Editar estación' : 'Nueva estación'}
      icon={PlugZap}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <SelectField label="Centro" value={centroId} onChange={(e) => setCentroId(e.target.value)}>
          {centros.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </SelectField>
        <FormField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Estación 4" />
      </div>
    </Modal>
  )
}

function TipoUsoForm({
  editing,
  onClose,
  onSave,
}: {
  editing: TipoUso | null
  onClose: () => void
  onSave: (t: TipoUso) => void
}) {
  const toast = useUiStore((s) => s.pushToast)
  const [nombre, setNombre] = useState(editing?.nombre ?? '')
  const [requiere, setRequiere] = useState(editing?.requiereVehiculo ?? true)
  function save() {
    if (!nombre.trim()) {
      toast('El nombre es obligatorio.', 'warn')
      return
    }
    onSave({
      id: editing?.id ?? slug(nombre).toUpperCase().replace(/-/g, '_'),
      nombre: nombre.trim(),
      requiereVehiculo: requiere,
    })
  }
  return (
    <Modal
      open
      title={editing ? 'Editar tipo de uso' : 'Nuevo tipo de uso'}
      icon={Car}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FormField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <label className="flex items-center gap-2 text-label-md">
          <input type="checkbox" checked={requiere} onChange={(e) => setRequiere(e.target.checked)} />
          Requiere vehículo
        </label>
      </div>
    </Modal>
  )
}
