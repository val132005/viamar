# Logo de Grupo Viamar

`src/components/brand/ViamarLogo.tsx` **se genera desde aquí**. No lo edites a mano:
el siguiente que corra este pipeline te pisará el cambio.

El punto de partida es `viamar-oficial.png`, el logo que hoy publica grupoviamar.com
(1024×330, mapa de bits de 2018). No hay SVG oficial disponible, así que se calca.

## Regenerar

```bash
cd tools/logo
npm install     # solo la primera vez
npm run logo
```

Encadena tres pasos:

1. **`separar.mjs`** — separa el bitmap en dos máscaras en blanco y negro, una por color
   de tinta: el azul de «VIAMAR» y el gris de «GRUPO». La esfera se excluye **por
   distancia al centro**, no por columna, para que las letras que la solapan se
   conserven enteras y la esfera se dibuje encima como en el original. Deja también
   `esfera.json` con su centro y radio medidos.
2. **`trazar.mjs`** — pasa cada máscara por potrace y monta el SVG. Los contornos van con
   `fill-rule="evenodd"`: sin eso los contrapunzones de la «A» y la «R» salen rellenos.
3. **`emitir-componente.mjs`** — convierte ese SVG en el componente TSX.

## Verificar

Dos páginas, sobre un servidor estático en esta carpeta
(`npx http-server -p 5999 -c-1`):

- **`overlay.html`** — el oficial, el vectorizado y ambos superpuestos. Donde calzan se ve
  gris plano; donde no, aparece color.
- **`medir-diff.html`** — lo mismo, pero con el número: cuenta qué porcentaje de la tinta
  difiere más de 32/255 y pinta en rojo dónde.

Estado medido de la versión actual: **6,87 % de la tinta**, todo en el borde de 1 px —
el antialias del bitmap original frente al filo del vector. Interior de letras y esfera
sin diferencia.

## Valores medidos sobre el original

| Qué | Valor |
|---|---|
| Azul de «VIAMAR» | `#0271B8` |
| Gris de «GRUPO» | `#858688` |
| Esfera | centro (840,5, 165) r 111; brillo en (902, 211), rampa `#F7F9FD` → `#0673B9` a 167 px |
| Proporción | 1024×330 ≈ **3,1:1** |

Ojo con la proporción: hay que dar **alto** al logo y dejar el ancho en `w-auto`. Con un
ancho fijo pensado para 5:1 el dibujo queda flotando dentro de su caja.

`analizar.mjs` no forma parte del pipeline; es la herramienta con la que se midieron los
colores dominantes y las cajas de cada familia de color. Se conserva por si hay que
repetir la medición con otro archivo.

## Si Viamar entrega el SVG oficial

Sustituirlo y borrar esta carpeta. Esto es un calco fiel, pero un calco: la fuente
original de las letras no se recupera de un bitmap.
