# Gestión integral de baterías — Grupo Viamar

Prototipo funcional del ciclo de vida de la batería: React 18 + Vite + TypeScript + Zustand.
Sin backend — todo el estado vive en el navegador (`localStorage`).

**Fases F0–F14 completas.** El guion de presentación está en [`docs/guion-demo.md`](docs/guion-demo.md).

---

## Arrancar

```bash
npm install     # solo la primera vez
npm run dev
```

Abrir la URL que imprime Vite (normalmente `http://localhost:5173/`).
Si el puerto está ocupado, Vite elige otro y lo muestra en consola: **usa el que imprime**.

> **Antes de presentar:** entrar como Álvaro → *Administración* → **Restablecer demo**.
> Deja los datos en su estado inicial y borra lo que se haya hecho en ensayos previos.

---

## Cuentas (login Entra simulado)

Pulsa *Continuar con Microsoft* y elige. No hay contraseña.

| Cuenta | Rol | Para qué sirve en la demo |
|---|---|---|
| Álvaro Paesano | Administrador | Ve todo. Maestros, políticas, matriz de permisos |
| Elizabeth Castro | Supervisor de gestión técnica | Chequeos y diagnóstico; **no** ve honra ni administración |
| Andree | Ventas / Garantías | Ejecuta la honra de mostrador |
| Fraisi Pimentel | Vendedor de negocios diversos | Visita al dealer, PDA |
| Rafael Núñez | Técnico de centro | Proceso de carga |
| José Ramón Díaz | Distribuidor | Portal del dealer — solo ve su propio inventario |
| Marisol Peña | Consulta | Solo lectura |

---

## Recorrido mínimo (3 minutos)

1. Entrar como **Álvaro**.
2. Buscador del header → `CIB-90822173` + Enter → ficha con **11 hitos** y reemplazo `CIB-90954410`.
3. *Políticas y fórmulas* → **FDD 489 marcado como vigente**; FRD 489 al lado como contraste.
4. Cambiar a **José Ramón Díaz** → buscar `CIB-91000010` → *«Sin coincidencias»* (aislamiento por dealer).

El guion completo de 12 minutos está en `docs/guion-demo.md`.

---

## Qué es y qué no

**Es** un prototipo para decidir: hace visible el ciclo de la batería después de la factura.

**No es** un sistema. No hay backend, ni MSAL real, ni integración con D365FO. La bandeja
*Integración F&O* muestra los payloads que se enviarían; no envía nada.

Los maestros (distribuidores, artículos, centros, clientes) son **ficticios verosímiles** —
ver [`docs/decisiones.md`](docs/decisiones.md) para saber qué es real y qué es de relleno.

---

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm test         # 17 tests del motor de garantía
npm run build    # build de producción a dist/
```
