# Guion de demo — App Gestión técnica Baterías Viamar (12 minutos)

Prototipo React + Vite + TS + Zustand. Datos semilla con fecha de referencia fija.

## 0. Login Elizabeth (1 min · 00:00–01:00)

- Entrar con **Elizabeth Castro** (`elizabeth.castro@grupoviamar.com`, SUPERVISOR_GT).
- Mostrar el token simulado `viamar-*` (iss `login.microsoftonline.com/viamar-demo`, 8 h).
- Aterrizar en el dashboard interno.

## 1. Serial estrella CIB-90822173 (2 min · 01:00–03:00)

- Teclear en el buscador global: **CIB-90822173**.
- Batería Solite Auto, vendida por el distribuidor piloto a María Almonte.
- Honra a los 8 meses (cobertura full): el cliente no paga y la vigencia **HEREDA**.
- Reemplazo: `CIB-90954410`.
- Once hitos en el timeline: ingreso → venta a dealer → chequeo → envío a carga → carga completada → venta a cliente → certificado → solicitud de garantía → diagnóstico → honra → reemplazo.

## 2. Gestión técnica (1 min · 03:00–04:00)

- Abrir **Gestión técnica**: solicitudes `SCH-2026-*` por dealer, estado y visita.
- Entrar a una solicitud y dictaminar una línea (Buen estado / Enviar a carga / Para garantía): guarda dictamen + history.

## 3. Fórmulas (1 min · 04:00–05:00)

- Abrir **Configuración / Políticas**: FDD489 vs FRD489, variables usadas.
- Mostrar que el diagnóstico no decide la cobertura económica: la decide la fórmula.

## 4. Honra full y prorrateo (2 min · 05:00–07:00)

- **Honra full**: `CIB-90830001` (8 meses, HEREDA, cliente paga 0).
- **Honra prorrateo**: `CIB-90830002` (14 meses, RESETEA, cliente paga diferencia).
- Ejecutar una honra de mostrador: crea reemplazo, cancela CERT-E original (C), emite CERT-E heredado, encola los 4 verbos.

## 5. Integración D365FO (1 min · 07:00–08:00)

- Abrir **Integración**: `RMA.CREAR`, `NOTA_CREDITO.EMITIR`, `MOVIMIENTO_INVENTARIO.REGISTRAR`, `RECLAMO_FABRICANTE.CREAR`.
- Filtrar por verbo/estado, abrir el drawer del payload JSON, reintentar un caso en error.

## 6. Rol dealer + honra piloto (2 min · 08:00–10:00)

- Cambiar al **Portal distribuidor (piloto)**: reportar venta (emite CERT-E), solicitar honra.
- Volver como Garantías a **Honras / Dealer**: autorizar con motivo → reposición FIFO (más antiguo primero) → reemplazo vinculado, CERT-C + CERT-E, 4 verbos.
- Ver en el portal el estado PENDIENTE → AUTORIZADA → EJECUTADA con serial de reemplazo.

## 7. Matriz de permisos (1 min · 10:00–11:00)

- Abrir **Administración**: matriz rol × capacidad, interruptor de honra del supervisor.
- Mostrar que el dealer sólo ve su inventario (scope por `dealerId`).

## 8. PDA y consulta pública (1 min · 11:00–12:00)

- **PDA** (`/pda`, 360 px): conteo contra esperado (faltantes/sobrantes), diagnóstico rápido con botones amplios, cierre de visita que genera el chequeo y navega a gestión técnica.
- **Pública** (`/certificado`): validar un CERT-E sin login. Cierre.
