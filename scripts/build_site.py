#!/usr/bin/env python3
"""
Genera docs/index.html desde inventario/inventario.json.

Reglas de seguridad (CLAUDE.md secc. 5, 11, 14):
- NUNCA se publica el campo `interno` (comps de marketplace, lógica de tasación).
- NUNCA se publica `config.fecha_salida_casa` ni `config.calendario_rebajas`.
- Se excluyen ítems marcados como borrador (interno.listo_para_publicar == False).
"""
import json, os, html, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INV = os.path.join(ROOT, "inventario", "inventario.json")
OUT = os.path.join(ROOT, "docs", "index.html")

PUBLIC_ITEM_FIELDS = [
    "id", "nombre", "categoria", "ambiente", "marca", "modelo", "antiguedad",
    "medidas", "estado", "defectos", "precio_ars", "precio_firme",
    "estado_venta", "fotos", "link_specs", "descripcion", "cantidad",
]
PUBLIC_CONFIG_FIELDS = ["whatsapp", "fecha_limite", "titulo_sitio", "linea_contexto"]

def is_draft(it):
    interno = it.get("interno") or {}
    return interno.get("listo_para_publicar") is False

def build_catalog(inv):
    items = []
    for it in inv.get("items", []):
        if is_draft(it):
            continue
        pub = {k: it[k] for k in PUBLIC_ITEM_FIELDS if k in it}
        items.append(pub)
    cfg = {k: inv["config"][k] for k in PUBLIC_CONFIG_FIELDS if k in inv.get("config", {})}
    return {"config": cfg, "items": items}

FAVICON = ("data:image/svg+xml,"
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E"
    "%3Crect width='100' height='100' rx='12' fill='%23FAF9F6' stroke='%231C1B18' stroke-width='7'/%3E"
    "%3Ctext x='50' y='68' font-family='monospace' font-size='46' font-weight='700' "
    "text-anchor='middle' fill='%231D3A8F'%3E%23%3C/text%3E%3C/svg%3E")

TEMPLATE = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="index,follow">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<link rel="icon" href="{favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Inter:wght@400;600;700&family=Saira+Stencil+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>

<header class="site-header">
  <div class="wrap hdr">
    <div class="hdr-brand">
      <span class="eyebrow">Liquidación por mudanza</span>
      <h1 class="display site-title" id="site-title">Liquidación Los Cardales</h1>
      <p class="site-sub" id="site-sub"></p>
    </div>
    <div class="hdr-side">
      <div class="deadline">
        <span class="k">Último día</span>
        <span class="v" id="deadline-val">—</span>
        <span class="d">para vender todo</span>
      </div>
      <a class="wa" id="wa-general" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.9 5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.6-6c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.5.3-.5c0-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6.7 12a5 5 0 0 0 1 2.5 11 11 0 0 0 4.3 3.8c1.6.7 1.7.5 2 .5a2.5 2.5 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.5-.3z"/></svg>
        Escribir por WhatsApp
      </a>
    </div>
  </div>
</header>

<div class="controls">
  <div class="wrap controls-inner">
    <div class="fgroup"><span class="flabel">Categoría</span><span id="f-categoria" style="display:contents"></span></div>
    <div class="fgroup"><span class="flabel">Estado</span><span id="f-estado" style="display:contents"></span></div>
    <span class="count" id="count"></span>
  </div>
</div>

<main class="wrap">
  <div id="catalogo"></div>

  <section class="mapa-sec">
    <div class="mapa-grid">
      <div id="mapa" role="img" aria-label="Mapa de la zona aproximada en Los Cardales"></div>
      <div class="mapa-txt">
        <h2>¿Dónde retirar?</h2>
        <p>Todo está en <strong>Los Cardales</strong> (Buenos Aires). El círculo marca la <strong>zona aproximada</strong>.</p>
        <p class="mapa-note">La dirección exacta se comparte por WhatsApp al coordinar la visita.</p>
      </div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="wrap foot">
    <div class="foot-brand">
      <span class="stencil">LOS CARDALES · LIQUIDACIÓN</span>
      <p>Precios firmes en pesos. Consultas y coordinación de visitas solo por WhatsApp.</p>
    </div>
    <a class="wa" id="wa-footer" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.9 5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.6-6c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.5.3-.5c0-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6.7 12a5 5 0 0 0 1 2.5 11 11 0 0 0 4.3 3.8c1.6.7 1.7.5 2 .5a2.5 2.5 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.5-.3z"/></svg>
      WhatsApp
    </a>
  </div>
</footer>

<div class="modal" id="modal" role="dialog" aria-modal="true"><div class="modal-card"></div></div>

<script id="catalogo-data" type="application/json">{data_json}</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
"""

def main():
    inv = json.load(open(INV, encoding="utf-8"))
    catalog = build_catalog(inv)

    # Verificación dura: ningún 'interno' ni dato sensible en el catálogo público
    blob = json.dumps(catalog, ensure_ascii=False)
    for forbidden in ("interno", "logica_tasacion", "fecha_salida_casa", "calendario_rebajas", "mercadolibre.com"):
        if forbidden in blob:
            sys.exit("ABORTADO: dato prohibido en catálogo público -> " + forbidden)

    cfg = catalog["config"]
    title = cfg.get("titulo_sitio", "Liquidación Los Cardales")
    desc = cfg.get("linea_contexto", "Liquidación total por mudanza — Los Cardales")
    data_json = json.dumps(catalog, ensure_ascii=False).replace("</", "<\\/")

    out = TEMPLATE.format(
        title=html.escape(title), desc=html.escape(desc),
        favicon=FAVICON, data_json=data_json,
    )
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(out)

    disp = sum(1 for i in catalog["items"] if i.get("estado_venta") != "vendido")
    print("OK -> docs/index.html")
    print("  items publicados:", len(catalog["items"]), "| disponibles:", disp)
    print("  excluidos (borrador):", sum(1 for i in inv["items"] if is_draft(i)))

if __name__ == "__main__":
    main()
