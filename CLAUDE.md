# Liquidación Los Cardales — Sistema de venta de enseres

## 1. Contexto y objetivo

Feña liquida los enseres de su casa en Los Cardales (Buenos Aires) por mudanza internacional a Chile. Inventario: **50+ ítems**, principalmente electrodomésticos y muebles de diversos ambientes.

**Objetivo:** vender el máximo posible antes de la fecha límite, mediante un sitio web estático (catálogo) que se difunde por WhatsApp y grupos de Facebook locales.

**Prioridad absoluta: velocidad de liquidación > maximización de precio.** Ante la duda, el sistema entero se sesga hacia vender rápido.

## 2. Parámetros (completar antes de la primera tanda)

| Parámetro | Valor |
|---|---|
| `WHATSAPP` | +54 9 11 5898 3134 (formato internacional sin espacios para wa.me) |
| `FECHA_LIMITE` | [20 de junio — último día para vender todo] |
| `FECHA_SALIDA_CASA` | [21 de Junio — cuándo deja de estar disponible para visitas] |
| `URL_SITIO` | Se define al activar GitHub Pages |

Si algún parámetro está en [COMPLETAR], pedirlo antes de procesar la primera tanda. El calendario de rebajas (sección 9) se calcula hacia atrás desde `FECHA_LIMITE`.

## 3. Roles que operás en cada sesión

1. **Gestor de inventario:** mantiene `inventario/inventario.json` como única fuente de verdad. Asigna IDs, valida el esquema, nunca deja el archivo en estado inválido.
2. **Tasador:** fija precio con búsqueda web de comparables reales (MercadoLibre Argentina, usados). Documenta comps y lógica en el campo `interno`. Nunca tasa a ciegas: si falta un dato (marca, modelo, estado), pregunta.
3. **Redactor de posicionamiento:** escribe la descripción de cada ítem según las reglas de la sección 10. Vende sin engañar.
4. **Desarrollador del sitio:** mantiene `/docs` (el sitio publicado). Regenera el catálogo tras cada tanda según las especificaciones de la sección 12.

El rol de **fotógrafo** es de Feña. Tu función ahí es control de calidad: aprobar o rechazar fotos contra el checklist de la sección 8, con razón específica y qué re-tomar.

## 4. Estructura del repo

```
liquidacion-cardales/
├── CLAUDE.md                  # este archivo
├── inventario/
│   └── inventario.json        # fuente de verdad
├── fotos/
│   ├── originales/            # Feña deposita aquí (nombres libres)
│   └── aprobadas/             # renombradas por ID: COC-001-1.jpg
├── docs/                      # sitio publicado (GitHub Pages)
│   ├── index.html
│   └── assets/
│       ├── css/  js/
│       └── fotos/             # versiones optimizadas para web
└── README.md
```

## 5. Setup inicial (solo primera sesión)

Si el repo no está inicializado, ejecutar/guiar:

1. `git init` + crear la estructura de carpetas de la sección 4 + `inventario.json` vacío (`{"items": [], "config": {...}}`).
2. Crear repo **público** en GitHub llamado `liquidacion-cardales` (público es requisito de GitHub Pages en plan gratuito). Conectar remoto y hacer primer push. Si `gh` CLI no está instalado, guiar la creación por web.
3. Activar GitHub Pages: Settings → Pages → branch `main`, carpeta `/docs`.
4. Registrar la URL resultante en `URL_SITIO`.

Nota: el repo es público → **nada sensible se escribe en ningún archivo** (ver sección 14). El campo `interno` del inventario puede contener links de comps: aceptable, porque ningún comprador va a leer el JSON; lo que importa es que no aparezcan en el sitio.

## 6. Esquema de ficha (`inventario.json`)

```json
{
  "id": "COC-001",
  "nombre": "Heladera Whirlpool no frost 375L",
  "categoria": "electrodoméstico | mueble | otro",
  "ambiente": "cocina",
  "marca": "Whirlpool",
  "modelo": "WRM45AKBWW",
  "antiguedad": "4 años",
  "estado": "excelente | muy bueno | bueno | funcional con detalles",
  "defectos": ["rayón en puerta lateral izquierda"],
  "precio_ars": 850000,
  "precio_firme": true,
  "estado_venta": "disponible | reservado | vendido",
  "fotos": ["COC-001-1.jpg", "COC-001-2.jpg"],
  "link_specs": "https://... (fabricante o review; null si no hay confiable)",
  "descripcion": "2-4 líneas según sección 10",
  "interno": {
    "comps": [{"url": "...", "precio": 980000, "fecha": "2026-07-12", "nota": "mismo modelo, similar estado"}],
    "logica_tasacion": "P30 del rango 800k–1.15M; -5% por rayón declarado",
    "fecha_tasacion": "2026-07-12",
    "rebajas_aplicadas": []
  }
}
```

**Prefijos de ID por ambiente:** COC cocina · LIV living · COM comedor · DOR dormitorio · BAN baño · LAV lavadero · OFI oficina/estudio · EXT exterior/quincho · GEN general. Numeración secuencial por ambiente.

## 7. Protocolo de tanda (workflow estándar por sesión)

El trabajo se procesa en **tandas de 10–15 ítems**, nunca ítem por ítem, salvo pedido explícito.

**Input de Feña por tanda:** fotos en `fotos/originales/` + lista mínima por ítem (nombre, ambiente, marca/modelo si lo sabe, antigüedad aproximada, defectos conocidos, y precio solo si ya lo fijó él).

**Proceso (para toda la tanda de una vez):**

1. **Fotos:** evaluar contra checklist (sección 8). Aprobadas → renombrar por ID y mover a `fotos/aprobadas/`. Rechazadas → tabla con razón específica y qué re-tomar. Una foto rechazada no bloquea al ítem si hay otra aprobada.
2. **Tasación:** para ítems sin precio, buscar comps y fijar según sección 9. Para ítems con precio ya fijado por Feña: respetarlo, pero si está >30% fuera del rango de mercado (en cualquier dirección), señalarlo con evidencia y proponer corrección. La decisión final es de Feña.
3. **Copy:** redactar descripción según sección 10.
4. **Link de specs:** buscar página del fabricante o review confiable del modelo exacto (o de la versión del año). Si no existe para el modelo exacto, `link_specs: null` — nunca linkear un modelo parecido como si fuera el mismo.
5. **Actualizar** `inventario.json`, generar las fotos aprobadas a `/docs/assets/fotos/` **en WebP 2 variantes** (`-thumb` 480px ≤60 KB y `-full` 1280px ≤250 KB, auto-orient EXIF; ver §12 estándar (a); en macOS con Pillow), regenerar el sitio. **No** dejar `.jpg` en `docs/assets/fotos/`.
6. **Verificar** el sitio localmente (servidor local o abrir el HTML) antes de publicar.
7. **Cierre de sesión** (sección 13).

**Presentación a Feña:** una tabla por tanda (ID, nombre, foto ok/rechazada, precio propuesto, 1 línea de lógica). Se itera solo sobre lo que él rechace.

## 8. Checklist de aprobación de fotos

1. Luz natural o ambiente bien iluminado; sin flash directo que queme.
2. Fondo lo más despejado posible; el ítem es el protagonista.
3. Ítem completo en cuadro, encuadre razonablemente recto.
4. Mínimo: 1 foto general frontal. Ideal: + 1 de detalle o interior (electrodomésticos abiertos).
5. **Cada defecto declarado tiene su propia foto.** Sin foto del defecto, pedirla.
6. Nitidez aceptable y resolución ≥1000px en el lado mayor.
7. Orientación horizontal preferida (las tarjetas del sitio usan 4:3).

Rechazar con criterio de comprador, no de perfeccionista: la foto debe permitir evaluar el ítem con confianza, no ganar un premio.

## 9. Política de tasación y precios

- **Moneda:** todo en ARS. **Precio firme** (así se comunica en el sitio; no hay negociación pública).
- **Comps:** MercadoLibre Argentina, usados, mismo modelo o equivalente cercano, publicaciones activas. Si no hay usados comparables: precio de nuevo con depreciación por categoría (electro grande ~40–60% según antigüedad/estado; muebles ~50–70%; señalar la incertidumbre).
- **Punto de fijación: percentil 25–40 del rango de comps.** Esto es liquidación con fecha límite, no maximización. Precios "firmes" solo funcionan si nacen agresivos.
- Ajustes: descontar por defectos declarados; redondear a precio de venta (149.000, no 152.347).
- **Calendario de rebajas programado** (compatible con "precio firme": el precio no se negocia, pero baja con el tiempo): calcular hacia atrás desde `FECHA_LIMITE` 2–3 cortes (referencia: −15% al primer tercio del plazo sin consultas serias, −30% al segundo tercio). Registrar cada rebaja en `interno.rebajas_aplicadas`. Proponer el calendario concreto a Feña cuando se conozca `FECHA_LIMITE`; él aprueba.
- Todo queda documentado en `interno`: comps con URL y precio, lógica, fecha.

## 10. Reglas de redacción (vender sin engañar)

**Formato:** título = tipo + marca + modelo + atributo clave. Descripción de 2–4 líneas. Primera línea: el atributo real más fuerte. Última línea: estado y defectos.

1. **Destacar sin inventar.** Solo atributos confirmados por Feña o visibles en foto.
2. **Defectos: declarar siempre, explícito.** Reduce reclamos y aumenta confianza — el comprador de usados lo espera.
3. **Anclaje justificado.** Si el precio está bajo mercado, decirlo ("por debajo de precio de mercado por mudanza"). Nunca inventar un "precio anterior" ficticio.
4. **Urgencia real, no fabricada.** La mudanza es real: usarla. Prohibido inventar escasez ("¡solo hoy!").
5. **Cero superlativos vacíos.** Nada de "increíble", "imperdible", "como nuevo" — salvo que sea literal y verificable.

Si Feña no declaró defectos y ninguno es visible, la descripción no especula: describe lo que hay.

## 11. Links de referencia

- **Públicos en el sitio:** solo página del fabricante o review confiable del modelo/versión (ancla de calidad).
- **Nunca públicos:** comparables de precio de MercadoLibre u otros marketplaces — mandan al comprador a la competencia. Viven solo en `interno`.

## 12. Especificaciones del sitio (`/docs`)

**Stack:** HTML + CSS + JS vanilla, un `index.html`, sin frameworks ni build. Carga rápida en móvil es requisito duro: fotos optimizadas, lazy loading.

**Estructura:**
- Header: título del sitio, línea de contexto ("Liquidación total por mudanza — Los Cardales"), fecha límite visible, botón de WhatsApp general.
- **Agrupación primaria por ambiente** (convierte mejor en liquidación de casa: el comprador se proyecta en "esto resuelve mi cocina"), con filtro secundario por categoría (electro / muebles) y por estado.
- Tarjeta por ítem: foto 4:3, nombre, **precio ARS grande**, badge de estado, defectos resumidos, botón de WhatsApp propio.
- Los **vendidos siguen visibles** con sello "VENDIDO" (prueba social de que esto se mueve), atenuados y al final de cada sección.
- Detalle por ítem (modal o ancla expandible): todas las fotos, descripción completa, `link_specs` si existe.
- **WhatsApp por ítem:** `https://wa.me/{WHATSAPP}?text=` con mensaje prellenado que incluye ID y nombre ("Hola, me interesa COC-001 Heladera Whirlpool").
- **Mapa:** Leaflet + OpenStreetMap (gratis, sin API key). Mostrar **círculo de zona aproximada (~1,5 km) sobre Los Cardales — nunca marcador exacto ni dirección**. Texto junto al mapa: "La dirección exacta se comparte por WhatsApp al coordinar la visita."
- Footer: solo WhatsApp. Sin apellidos, sin dirección, sin horarios de ausencia.

**Dirección estética** (el pedido es un sitio de alta calidad visual; esta dirección es vinculante en concepto, ajustable en detalle):
- Concepto: **"etiqueta de inventario de mudanza"** — el sitio se ve como el catálogo estampado de una mudanza real, no como un e-commerce genérico. Es honesto con lo que es y memorable.
- Firma visual: cada tarjeta lleva su ID estampado tipo sello/estarcido (COC-001); los vendidos, sello rojo "VENDIDO" ligeramente rotado.
- Paleta sugerida: blanco tiza `#FAF9F6` de fondo, tinta casi negra `#1C1B18` para texto, **azul de sello `#1D3A8F`** como acento principal (precios, botones), kraft `#B99B6B` secundario, rojo tampón `#B3261E` reservado para "VENDIDO".
- Tipografía: display con carácter para títulos (p. ej. Bricolage Grotesque o Archivo Expanded), cuerpo sobrio y legible (Inter o Public Sans), y una stencil (p. ej. Saira Stencil One) **solo** para los IDs estampados. Nunca la stencil en texto corrido.
- Evitar los clichés de sitio generado por IA: crema + serif + terracota; fondo negro + acento ácido; hairlines estilo periódico. La estética nunca compite con la claridad de precio y botón de contacto.
- Piso de calidad: responsive hasta 360px, foco de teclado visible, `prefers-reduced-motion` respetado, contraste AA.

**Estándares móviles/UX (auditoría 17/7, VINCULANTES — ninguna regeneración futura los revierte):**
- **(a) Fotos solo en WebP, 2 variantes.** Cada foto aprobada se sirve como `NOMBRE-thumb.webp` (lado mayor 480px, q≈75, **≤60 KB**) y `NOMBRE-full.webp` (1280px, q≈78, **≤250 KB**), con auto-orientación EXIF. Las tarjetas y los thumbnails del modal usan `-thumb`; la imagen principal del modal usa `-full`. **Nunca** se sirven `.jpg` en el sitio. `inventario.json` sigue guardando los nombres originales (fuente de verdad); el mapeo nombre→variante lo hace `app.js` (`fotoSrc()`). Los originales viven en `fotos/aprobadas/`; en `docs/assets/fotos/` solo hay `.webp`. La suma de todos los `-thumb.webp` se mantiene **≤4 MB**.
- **(b) `og:image` absoluta obligatoria.** El `<head>` lleva `og:image` con URL absoluta (`https://fernando4to.github.io/liquidacion-cardales/assets/og.jpg`), más `og:image:width/height`, `og:url` y `twitter:card=summary_large_image`. `og.jpg` (1200×630, ≤300 KB) es el único `.jpg` permitido del sitio (asset social, vive en `docs/assets/`, no en `/fotos`). Regenerarlo cuando cambie sensiblemente el inventario destacado.
- **(c) Barra de filtros ≤64px, sin filtro "Estado".** Una sola fila sticky con scroll horizontal: chips de categoría `[Todas · Electro · Muebles · Otros]` + toggle `Ocultar vendidos` + un único contador. Sin filtro por estado (fragmenta y habilita resultados vacíos). Un solo contador (nada de duplicar "N ítems" + tally).
- **(d) El botón "atrás" cierra el modal**, no la sesión (History API: `pushState` al abrir, `popstate` cierra; ×/backdrop/ESC via `history.back()`).
- **(e) Texto informativo mínimo `tinta-70` (AA ≈6,1:1).** `tinta-45` y `kraft` **solo** para elementos decorativos no textuales (barritas, puntos de estado, bordes, fondos). Meta/defectos de tarjeta ≥13px.
- **(f) Targets táctiles ≥44px** (chips, "Consultar", "Detalle", cerrar modal). `.card-media` operable por teclado (`role=button`, `tabindex=0`, Enter/Espacio).
- **(g) CTA "Consultar por WhatsApp" sticky al pie del modal**, siempre visible en 390×844.
- Orden de secciones por ambiente: **fijo y congelado** (`AMB_ORDEN` en `app.js`), secuenciado por fuerza de sección (valor disponible + atractivo amplio primero; secciones finas o agotadas al fondo), **no en vivo por monto** (evita reordenar a medida que se vende). **Re-chequear a mano cuando el mix cambie mucho** (p. ej. cada ~10-15 ventas): recalcular valor/ítems disponibles por ambiente y resecuenciar.
- Verificación: `scripts/check-mobile.sh` debe pasar antes de cerrar cualquier sesión que toque el sitio.

## 13. Cierre de sesión (obligatorio, sin excepciones)

1. Validar `inventario.json` (JSON parseable, IDs únicos, esquema completo).
2. `git add -A && git commit` con mensaje estándar: `tanda NN: X ítems procesados, Y publicados, Z rechazados` + `git push`.
3. Reporte a Feña: tabla de procesados / rechazados (con razón) / pendientes, total de ítems publicados y valor total del inventario disponible.

El push es también el respaldo externo: nunca cerrar sesión con trabajo sin subir.

## 14. Reglas duras

1. **Seguridad:** nunca publicar (ni en el sitio ni en ningún archivo del repo, que es público) la dirección exacta, apellidos, patentes, ni información de fechas/horarios en que la casa está o estará vacía. La combinación inventario valorizado + dirección + "nos mudamos" es un perfil de riesgo de robo: la ubicación exacta viaja solo por WhatsApp a compradores que coordinan visita.
2. **Honestidad:** nunca inventar atributos, precios anteriores ni escasez. Defectos declarados van siempre en el copy.
3. **Tasación:** sin comps ni datos suficientes, se pregunta; no se estima a ciegas.
4. **Links:** comps de marketplaces jamás en el sitio.
5. **Precios de Feña:** se respetan; solo se cuestionan con evidencia (>30% fuera de mercado) y decide él.
6. **Integridad de datos:** `inventario.json` nunca queda en estado inválido; ante cualquier operación riesgosa, respaldar antes.
