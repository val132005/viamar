import fs from 'node:fs'
import potrace from 'potrace'

const e = JSON.parse(fs.readFileSync('esfera.json', 'utf8'))

function trace(file) {
  return new Promise((res, rej) => {
    const p = new potrace.Potrace({
      turdSize: 2,
      alphaMax: 1,
      optCurve: true,
      optTolerance: 0.2,
      threshold: 128,
      blackOnWhite: true,
    })
    p.loadImage(file, (err) => {
      if (err) return rej(err)
      res([...p.getSVG().matchAll(/ d="([^"]+)"/g)].map((m) => m[1]))
    })
  })
}

const [viamar, grupo] = await Promise.all([trace('mask-viamar.png'), trace('mask-grupo.png')])

// Degradado de la esfera medido pixel a pixel sobre el PNG oficial (medir-esfera.mjs):
// foco del brillo en (902, 211) y rampa que agota el color a 167 px de ese foco.
const foco = { x: 902, y: 211, r: 167 }
const rampa = [
  [0, '#F7F9FD'], [11, '#D5E2F2'], [22, '#B5CCE7'], [33, '#94B6DD'],
  [44, '#6F9CCF'], [56, '#4D88C4'], [67, '#3980C1'], [78, '#1D79BF'],
  [89, '#0F75BD'], [100, '#0673B9'],
]

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 330" role="img" aria-label="Grupo Viamar">
  <defs>
    <radialGradient id="vmSphere" gradientUnits="userSpaceOnUse" cx="${foco.x}" cy="${foco.y}" r="${foco.r}">
${rampa.map(([o, c]) => `      <stop offset="${o}%" stop-color="${c}"/>`).join('\n')}
    </radialGradient>
  </defs>
  <g fill="#858688" fill-rule="evenodd">
${grupo.map((d) => `    <path d="${d}"/>`).join('\n')}
  </g>
  <g fill="#0271B8" fill-rule="evenodd">
${viamar.map((d) => `    <path d="${d}"/>`).join('\n')}
  </g>
  <circle cx="${e.cx.toFixed(1)}" cy="${e.cy.toFixed(1)}" r="${e.rad.toFixed(1)}" fill="url(#vmSphere)"/>
</svg>
`

fs.writeFileSync('viamar-vectorizado.svg', svg)
console.log('paths VIAMAR:', viamar.length, '| GRUPO:', grupo.length, '| bytes:', svg.length)
