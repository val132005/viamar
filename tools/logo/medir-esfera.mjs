import fs from 'node:fs'
import { PNG } from 'pngjs'

const png = PNG.sync.read(fs.readFileSync('viamar-oficial.png'))
const { width, data } = png
const e = JSON.parse(fs.readFileSync('esfera.json', 'utf8'))
const px = (x, y) => {
  const i = (Math.round(y) * width + Math.round(x)) * 4
  return [data[i], data[i + 1], data[i + 2]]
}
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()

// 1. centro del brillo: pixel mas claro dentro del disco
let best = null
for (let y = e.y0; y <= e.y1; y++) {
  for (let x = e.x0; x <= e.x1; x++) {
    const dx = x - e.cx, dy = y - e.cy
    if (dx * dx + dy * dy > (e.rad - 2) ** 2) continue
    const [r, g, b] = px(x, y)
    const lum = r + g + b
    if (!best || lum > best.lum) best = { x, y, lum, c: [r, g, b] }
  }
}
console.log('brillo en', best.x, best.y, hex(best.c),
  '=> cx', (((best.x - e.x0) / e.w) * 100).toFixed(1) + '%',
  'cy', (((best.y - e.y0) / e.h) * 100).toFixed(1) + '%')

// 2. rampa radial desde el brillo hacia el borde mas lejano del disco
const dirX = e.cx - best.x, dirY = e.cy - best.y
const norm = Math.hypot(dirX, dirY) || 1
const ux = dirX / norm, uy = dirY / norm
// distancia desde el brillo hasta el borde siguiendo esa direccion
const maxD = norm + e.rad - 2
console.log('radio efectivo del degradado:', maxD.toFixed(1), 'px =', ((maxD / e.rad) * 100).toFixed(0) + '% del radio')
for (const f of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
  const d = maxD * f
  console.log(`  ${(f * 100).toString().padStart(3)}%  ${hex(px(best.x + ux * d, best.y + uy * d))}`)
}
