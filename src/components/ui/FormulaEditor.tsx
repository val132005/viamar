import { TextAreaField } from './FormField'
import { Button } from './Button'
import { FORMULA_VARS } from '../../domain/warranty/formula'
import { PRESET_FDD489, PRESET_FRD489 } from '../../domain/warranty/presets'

const PRESETS = {
  FDD489: PRESET_FDD489,
  FRD489: PRESET_FRD489,
}

type Props = {
  value: string
  onChange: (next: string) => void
}

export function FormulaEditor({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outlined" className="h-8 text-label-md" onClick={() => onChange(PRESETS.FDD489)}>
          Preset FDD 489
        </Button>
        <Button variant="outlined" className="h-8 text-label-md" onClick={() => onChange(PRESETS.FRD489)}>
          Preset FRD 489
        </Button>
      </div>
      <TextAreaField
        label="Expresión"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-[13px]"
        hint="Evaluador propio (sin eval). Identificadores fuera de la lista blanca se rechazan."
      />
      <div className="flex flex-wrap gap-1">
        {FORMULA_VARS.map((v) => (
          <button
            key={v}
            type="button"
            className="px-2 py-0.5 rounded-sm border border-viamar-200 bg-viamar-50 text-viamar-700 text-label-sm"
            onClick={() => onChange(value ? `${value} ${v}` : v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
