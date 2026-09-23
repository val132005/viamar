import { describe, expect, it } from 'vitest'
import { sugerirDiagnostico } from './diagnosis'

describe('sugerirDiagnostico', () => {
  it('sugiere garantía si la capacidad está bajo 50 %', () => {
    expect(sugerirDiagnostico(12.4, 1.24, 48).diagnostico).toBe('PARA_GARANTIA')
  })
  it('sugiere carga si el voltaje está bajo', () => {
    expect(sugerirDiagnostico(11.8, 1.22, 80).diagnostico).toBe('DESCARGADA')
  })
  it('sugiere buen estado con mediciones sanas', () => {
    expect(sugerirDiagnostico(12.6, 1.26, 92).diagnostico).toBe('BUEN_ESTADO')
  })
  it('queda pendiente sin mediciones', () => {
    expect(sugerirDiagnostico(0, 0, 0).diagnostico).toBe('PENDIENTE')
  })
})
