import fs from 'node:fs'
import { PNG } from 'pngjs'

const png = PNG.sync.read(fs.readFileSync('viamar-oficial.png'))
const { width, height, data } = png
const counts = new Map()
for (let i = 0; i < data.length; i += 4) {
  const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
  if (a < 20) continue
  // cuantizar a bloques de 16 para agrupar
  const key = `${r >> 4},${g >> 4},${b >> 4}`
  const cur = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
  cur.n++; cur.r += r; cur.g += g; cur.b += b
  counts.set(key, cur)
}
const top = [...counts.values()]
  .sort((a, b) => b.n - a.n)
  .slice(0, 12)
  .map((c) => {
    const r = Math.round(c.r / c.n), g = Math.round(c.g / c.n), b = Math.round(c.b / c.n)
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
    return { hex, px: c.n, pct: ((c.n / (width * height)) * 100).toFixed(1) }
  })
console.log(`${width}x${height}`)
console.table(top)

// bounding boxes por familia de color
function bbox(test) {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] < 20) continue
      if (test(data[i], data[i + 1], data[i + 2])) {
        if (x < x0) x0 = x; if (x > x1) x1 = x
        if (y < y0) y0 = y; if (y > y1) y1 = y
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}
const esAzul = (r, g, b) => b > 110 && b - r > 40 && g < b
const esGris = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) < 28 && r > 80 && r < 200
console.log('azul  ', bbox(esAzul))
console.log('gris  ', bbox(esGris))
