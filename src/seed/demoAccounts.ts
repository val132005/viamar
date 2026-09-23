import type { Usuario } from '../domain/types'

export const DEMO_ACCOUNTS: Usuario[] = [
  {
    id: 'usr-alvaro',
    nombre: 'Álvaro Paesano',
    email: 'alvaro.paesano@grupoviamar.com',
    rol: 'ADMIN',
    cargo: 'Administrador del prototipo',
    iniciales: 'AP',
  },
  {
    id: 'usr-fraisi',
    nombre: 'Fraisi Pimentel',
    email: 'fraisi.pimentel@grupoviamar.com',
    rol: 'VENDEDOR_ND',
    cargo: 'Vendedora de negocios diversos',
    iniciales: 'FP',
  },
  {
    id: 'usr-elizabeth',
    nombre: 'Elizabeth Castro',
    email: 'elizabeth.castro@grupoviamar.com',
    rol: 'SUPERVISOR_GT',
    cargo: 'Supervisora de gestión técnica',
    iniciales: 'EC',
  },
  {
    id: 'usr-tecnico',
    nombre: 'Rafael Núñez',
    email: 'rafael.nunez@grupoviamar.com',
    rol: 'TECNICO',
    cargo: 'Operación de carga y diagnóstico',
    iniciales: 'RN',
  },
  {
    id: 'usr-andree',
    nombre: 'Andree',
    email: 'andree@grupoviamar.com',
    rol: 'VENTAS_GARANTIAS',
    cargo: 'Ventas de mostrador / Garantías',
    iniciales: 'AN',
  },
  {
    id: 'usr-dealer',
    nombre: 'José Ramón Díaz',
    email: 'jdiaz@autorepuestoselcaribe.com.do',
    rol: 'DISTRIBUIDOR',
    cargo: 'Encargado de mostrador · distribuidor piloto',
    iniciales: 'JD',
    dealerId: 'dealer-piloto',
    dealerNombre: 'Auto Repuestos El Caribe SRL',
  },
  {
    id: 'usr-consulta',
    nombre: 'Marisol Peña',
    email: 'marisol.pena@grupoviamar.com',
    rol: 'CONSULTA',
    cargo: 'Gerencia comercial · sólo lectura',
    iniciales: 'MP',
  },
]

export function accountById(id: string): Usuario | undefined {
  return DEMO_ACCOUNTS.find((a) => a.id === id)
}
