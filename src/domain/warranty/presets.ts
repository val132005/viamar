export const PRESET_FDD489 =
  'mesesUso <= mesesFull ? precioBase : precioBase - (precioBase / mesesProrrateo) * mesesUso'

export const PRESET_FRD489 =
  'mesesUso <= mesesFull ? 0 : precioVigente - (precioBase - (precioBase / mesesProrrateo) * mesesUso)'
