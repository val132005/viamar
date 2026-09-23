import fs from 'node:fs'

const DESTINO = new URL('../../src/components/brand/ViamarLogo.tsx', import.meta.url)
const svg = fs.readFileSync(new URL('viamar-vectorizado.svg', import.meta.url), 'utf8')

const grad = /<radialGradient[^>]*cx="(\d+)"[^>]*cy="(\d+)"[^>]*r="(\d+)"/.exec(svg)
const stops = [...svg.matchAll(/<stop offset="(\d+)%" stop-color="(#[0-9A-F]{6})"\/>/g)]
const grupos = [...svg.matchAll(/<g fill="(#[0-9A-Fa-f]{6})" fill-rule="evenodd">\s*<path d="([^"]+)"\/>\s*<\/g>/g)]
const circ = /<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/.exec(svg)

if (!grad || stops.length === 0 || grupos.length !== 2 || !circ) {
  throw new Error(`parseo incompleto: grad=${!!grad} stops=${stops.length} grupos=${grupos.length} circ=${!!circ}`)
}

const [, gx, gy, gr] = grad
const [, cx, cy, cr] = circ

const tsx = `// Logo oficial de Grupo Viamar.
// Trazado desde el PNG del sitio corporativo (1024x330) con potrace; el azul (#0271B8),
// el gris (#858688) y la rampa de la esfera estan medidos pixel a pixel sobre ese original.
// Diferencia medida frente al PNG: 6,9 % de la tinta, toda en el borde de 1 px (antialias).
// No editar a mano: se regenera con tools/logo (ver tools/logo/README.md).

type ViamarLogoProps = {
  className?: string
}

export function ViamarLogo({ className = 'h-12 w-auto' }: ViamarLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 330"
      role="img"
      aria-label="Grupo Viamar"
      className={className}
    >
      <defs>
        <radialGradient id="viamarSphere" gradientUnits="userSpaceOnUse" cx="${gx}" cy="${gy}" r="${gr}">
${stops.map(([, o, c]) => `          <stop offset="${o}%" stopColor="${c}" />`).join('\n')}
        </radialGradient>
      </defs>
${grupos
  .map(
    ([, fill, d]) => `      <g fill="${fill}" fillRule="evenodd">
        <path d="${d}" />
      </g>`,
  )
  .join('\n')}
      <circle cx="${cx}" cy="${cy}" r="${cr}" fill="url(#viamarSphere)" />
    </svg>
  )
}
`

fs.writeFileSync(DESTINO, tsx)
console.log('escrito', DESTINO.pathname, '|', tsx.length, 'bytes |', stops.length, 'stops |', grupos.length, 'grupos')
