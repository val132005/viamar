import { describe, expect, it } from 'vitest'
import { coberturaMes, evaluarHonra } from './engine'
import { evaluateFormula } from './formula'
import { mesesCalendarioEnteros } from './months'
import { WARRANTY_CASES } from './testCases'

describe('mesesCalendarioEnteros', () => {
  it('15/03/2025 → 14/09/2026 = 17', () => {
    expect(mesesCalendarioEnteros(new Date(2025, 2, 15), new Date(2026, 8, 14))).toBe(17)
  })
  it('15/03/2025 → 15/09/2026 = 18', () => {
    expect(mesesCalendarioEnteros(new Date(2025, 2, 15), new Date(2026, 8, 15))).toBe(18)
  })
  it('31/01/2025 → 28/02/2025 = 1 (fin de mes)', () => {
    expect(mesesCalendarioEnteros(new Date(2025, 0, 31), new Date(2025, 1, 28))).toBe(1)
  })
})

describe('evaluateFormula', () => {
  it('no usa eval y resuelve ternario', () => {
    expect(
      evaluateFormula('mesesUso <= mesesFull ? precioBase : 1', {
        mesesUso: 8,
        mesesFull: 12,
        mesesProrrateo: 24,
        precioOriginal: 180,
        precioVigente: 180,
        precioBase: 180,
      }),
    ).toBe(180)
  })
  it('rechaza identificadores ajenos', () => {
    expect(() =>
      evaluateFormula('window', {
        mesesUso: 1,
        mesesFull: 12,
        mesesProrrateo: 24,
        precioOriginal: 1,
        precioVigente: 1,
        precioBase: 1,
      }),
    ).toThrow(/no permitida/)
  })
})

describe('coberturaMes — escalón post-full (FDD 489)', () => {
  it('mes 12 = 100 % y mes 13 ≈ 45,8 %', () => {
    expect(coberturaMes(12, 12, 24)).toBe(100)
    expect(coberturaMes(13, 12, 24)).toBeCloseTo(45.833, 2)
  })
})

describe('evaluarHonra — casos de negocio', () => {
  for (const c of WARRANTY_CASES) {
    it(c.nombre, () => {
      const r = evaluarHonra(c.input)
      expect(r.admisible).toBe(c.expect.admisible)
      if (c.expect.motivoRechazo) expect(r.motivoRechazo).toBe(c.expect.motivoRechazo)
      if (c.expect.mesesUso !== undefined) expect(r.mesesUso).toBe(c.expect.mesesUso)
      if (c.expect.decisionVigencia) expect(r.decisionVigencia).toBe(c.expect.decisionVigencia)
      if (c.expect.montoCliente !== undefined) expect(r.montoCliente).toBe(c.expect.montoCliente)
      if (c.expect.motivoRechazo === 'BAJO_UMBRAL') expect(r.montoAcreditar).toBe(0)
    })
  }
})
