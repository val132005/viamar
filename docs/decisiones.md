# Decisiones de seed (T1.2)

Fecha: 2026-09-23 (revisa la versión del 2026-09-22)

Los FDD 111/489/699 y el FRD 489 **no listan nombres comerciales de dealers ni códigos de artículo**. La tabla de artículos del FDD 111 es una captura de pantalla, no texto extraíble.

**Decisión del 23-sep:** al ser un prototipo, los maestros se completan con datos ficticios
verosímiles en vez de dejar rótulos `[por confirmar]` visibles en pantalla. El aviso de que
los datos son de demostración ya lo da el banner permanente de todos los layouts.

## Lo que sí está documentado (se mantiene real)

- Marcas: Viamax, Ford Motorcraft, Solite (portal público de certificados).
- Tipos de uso: **Automóvil** y **Otros** (FDD 111).
- Almacén de ejemplo de reposición: **GB** (FRD 489).
- Serial de demo: `CIB-90822173` (entendimiento / mockups).
- Equipo Viamar como usuarios internos: Álvaro Paesano, Fraisi Pimentel, Elizabeth Castro,
  Andree. Rafael Núñez (técnico) y Marisol Peña (consulta) son ficticios: no aparecían en
  la documentación y hacía falta un titular para esos dos roles.

## Ficticio verosímil (sustituible sin tocar el motor)

- **8 distribuidores** con razón social dominicana y RNC con formato válido. El piloto es
  `Auto Repuestos El Caribe SRL` (Santo Domingo), operado por José Ramón Díaz.
- **12 SKU** (`VMX-48-650`, `MC-AGM-1000`, `SOL-48-600`…) con grupo BCI, CCA y precio USD.
- **2 centros de carga** con dirección: Km 9 Autopista Duarte (Santo Domingo) y
  Av. Estrella Sadhalá (Santiago).
- **Clientes finales**: nombres y cédulas inventadas con formato dominicano, por decisión
  explícita del 23-sep — no se exponen clientes reales en un prototipo sin control de acceso.

Cuando Viamar entregue el maestro real, se sustituyen estos valores sin tocar `/domain`.
El flag `porConfirmar` sigue existiendo en las entidades por si hace falta volver a marcar
un registro como provisional.

## Parámetros del motor que el prototipo fija por su cuenta

Son valores plausibles, no confirmados por Viamar. Están en `src/seed/masters.ts` y se
editan desde la pantalla de Políticas:

| Parámetro | Valor usado | Origen |
|---|---|---|
| Meses full | 12 | FDD 489 |
| Meses prorrateo | 24 | FDD 489 |
| Umbral mínimo de capacidad | 50 % (48 % en Solite) | supuesto del prototipo (WI #2928 lo exige, no lo cuantifica) |
| Plazo de reclamo | 30 días | supuesto del prototipo |
| Base de cálculo | PRECIO_ORIGINAL | FDD 489 |
