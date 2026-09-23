import fs from 'node:fs'
import { PNG } from 'pngjs'

const png = PNG.sync.read(fs.readFileSync('viamar-oficial.png'))
const { width, height, data } = png

const esAzul = (r, g, b) => b > 110 && b - r > 40 && g < b
const esGris = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) < 28 && r > 80 && r < 200

// --- localizar la esfera (círculo macizo a la derecha) ---
const yMid = Math.floor(height / 2)
let xSphereStart = -1, colMin = -1
for (let x = width - 1; x > 0; x--) {
  const i = (yMid * width + x) * 4
  const on = data[i + 3] >= 20 && esAzul(data[i], data[i + 1], data[i + 2])
  if (on) { if (xSphereStart < 0) xSphereStart = x }
  else if (xSphereStart >= 0) {
    let hueco = 0
    for (let k = x; k > 0 && hueco < 12; k--) {
      const j = (yMid * width + k) * 4
      if (data[j + 3] >= 20 && esAzul(data[j], data[j + 1], data[j + 2])) break
      hueco++
    }
    if (hueco >= 12) { colMin = x + 1; break }
    xSphereStart = -1
  }
}
let rowMin = 1e9, rowMax = -1
for (let y = 0; y < height; y++) {
  for (let x = colMin; x <= xSphereStart; x++) {
    const i = (y * width + x) * 4
    if (data[i + 3] >= 20 && esAzul(data[i], data[i + 1], data[i + 2])) {
      if (y < rowMin) rowMin = y
      if (y > rowMax) rowMax = y
    }
  }
}
const esfera = { x0: colMin, x1: xSphereStart, y0: rowMin, y1: rowMax, w: xSphereStart - colMin + 1, h: rowMax - rowMin + 1 }
const cx = esfera.x0 + esfera.w / 2
const cy = esfera.y0 + esfera.h / 2
const rad = Math.min(esfera.w, esfera.h) / 2
console.log('esfera:', esfera, '| cx,cy,r =', cx.toFixed(1), cy.toFixed(1), rad.toFixed(1))

// Excluir la esfera por DISTANCIA AL CENTRO, no por columna.
// Así las letras que se solapan con ella se conservan completas y la esfera
// se dibuja encima, igual que en el original.
const dentroEsfera = (x, y) => {
  const dx = x - cx, dy = y - cy
  return dx * dx + dy * dy <= (rad + 3) * (rad + 3)
}

function maskToPng(test, file) {
  const out = new PNG({ width, height })
  let on = 0
  for (let i = 0; i < data.length; i += 4) {
    const px = (i / 4) % width
    const py = Math.floor(i / 4 / width)
    const hit = data[i + 3] >= 20 && !dentroEsfera(px, py) && test(data[i], data[i + 1], data[i + 2])
    if (hit) on++
    const v = hit ? 0 : 255
    out.data[i] = v; out.data[i + 1] = v; out.data[i + 2] = v; out.data[i + 3] = 255
  }
  fs.writeFileSync(file, PNG.sync.write(out))
  return on
}

const nAzul = maskToPng(esAzul, 'mask-viamar.png')
const nGris = maskToPng(esGris, 'mask-grupo.png')
fs.writeFileSync('esfera.json', JSON.stringify({ ...esfera, cx, cy, rad }))
console.log('px VIAMAR:', nAzul, '| px GRUPO:', nGris)
