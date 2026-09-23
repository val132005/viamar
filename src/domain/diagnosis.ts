export type SugerenciaDiagnostico = {
  diagnostico: 'BUEN_ESTADO' | 'DESCARGADA' | 'PARA_GARANTIA' | 'DANADA' | 'PENDIENTE'
  accion: string
}

export function sugerirDiagnostico(
  voltaje: number,
  densidad: number,
  capacidadPct: number,
): SugerenciaDiagnostico {
  if (!voltaje && !densidad && !capacidadPct) {
    return { diagnostico: 'PENDIENTE', accion: 'Pendiente de medición' }
  }
  if (capacidadPct > 0 && capacidadPct < 50) {
    return { diagnostico: 'PARA_GARANTIA', accion: 'Analizar garantía' }
  }
  if (voltaje > 0 && voltaje < 10.8) {
    return { diagnostico: 'PARA_GARANTIA', accion: 'Analizar garantía' }
  }
  if (densidad > 0 && densidad < 1.12) {
    return { diagnostico: 'DANADA', accion: 'Registrar daño' }
  }
  if (voltaje > 0 && voltaje < 12.2) {
    return { diagnostico: 'DESCARGADA', accion: 'Enviar a carga' }
  }
  if (densidad > 0 && densidad < 1.2) {
    return { diagnostico: 'DESCARGADA', accion: 'Enviar a carga' }
  }
  return { diagnostico: 'BUEN_ESTADO', accion: 'Sin acción' }
}

export const ACCIONES_SUPERVISOR: { diagnostico: SugerenciaDiagnostico['diagnostico']; accion: string; label: string }[] =
  [
    { diagnostico: 'BUEN_ESTADO', accion: 'Sin acción', label: 'Buen estado' },
    { diagnostico: 'DESCARGADA', accion: 'Enviar a carga', label: 'Enviar a carga' },
    { diagnostico: 'PARA_GARANTIA', accion: 'Analizar garantía', label: 'Para garantía' },
    { diagnostico: 'DANADA', accion: 'Registrar daño', label: 'Dañada' },
  ]
