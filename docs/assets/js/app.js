/* Liquidación Los Cardales — render del catálogo (vanilla JS) */
(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("catalogo-data").textContent);
  var CFG = DATA.config || {};
  var ITEMS = DATA.items || [];

  // Orden FIJO y CONGELADO, secuenciado por fuerza de sección (valor + atractivo), no en vivo.
  // Lidera con las habitaciones core de amplio atractivo; al fondo lo chico/agotado. Revisar a mano si cambia el mix.
  var AMB_ORDEN = ["living", "exterior", "oficina", "dormitorio", "comedor", "general", "niños", "lavadero", "cocina", "baño"];
  var CAT_LABEL = { "electrodoméstico": "Electro", "mueble": "Muebles", "otro": "Otros" };

  var filtro = { categoria: "todas", disp: "todas" };

  /* ---------- helpers ---------- */
  function money(n) {
    return "$" + Number(n).toLocaleString("es-AR");
  }
  function waURL(text) {
    return "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(text);
  }
  function waItem(it) {
    return waURL("Hola, me interesa " + it.id + " " + it.nombre + " — " + money(it.precio_ars) + ". ¿Sigue disponible?");
  }
  // inventario.json guarda los nombres de archivo originales (fuente de verdad); el sitio sirve solo WebP en 2 variantes (-thumb / -full).
  function fotoSrc(name, kind) {
    return "assets/fotos/" + String(name).replace(/\.jpe?g$/i, "-" + kind + ".webp");
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- tarjeta ---------- */
  function card(it) {
    var vendido = it.estado_venta === "vendido";
    var c = el("article", "card" + (vendido ? " vendido" : ""));
    c.setAttribute("data-cat", it.categoria);
    c.setAttribute("data-estado", it.estado);

    var media = el("div", "card-media");
    if (it.fotos && it.fotos[0]) {
      media.innerHTML =
        '<img loading="lazy" src="' + esc(fotoSrc(it.fotos[0], "thumb")) + '" alt="' + esc(it.nombre) + '">' +
        '<span class="stamp-id stencil">' + esc(it.id) + "</span>" +
        (it.fotos.length > 1
          ? '<span class="badge-fotos">▦ ' + it.fotos.length + " fotos</span>"
          : "");
    } else {
      media.innerHTML =
        '<div class="foto-pendiente"><span class="fp-ico">▦</span><span>' +
          esc(it.foto_pendiente || "Foto próximamente") + "</span></div>" +
        '<span class="stamp-id stencil">' + esc(it.id) + "</span>";
    }
    if (vendido) media.appendChild(el("span", "stamp-vendido", "Vendido"));
    media.setAttribute("role", "button");
    media.setAttribute("tabindex", "0");
    media.setAttribute("aria-label", "Ver detalle de " + it.nombre);
    media.addEventListener("click", function () { openModal(it); });
    media.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(it); }
    });
    c.appendChild(media);

    var body = el("div", "card-body");
    body.appendChild(el("h3", "card-name", esc(it.nombre)));

    var meta = [];
    if (it.marca) meta.push(esc(it.marca));
    if (it.antiguedad && !/no especifica/i.test(it.antiguedad)) meta.push(esc(it.antiguedad));
    if (it.medidas) meta.push(esc(it.medidas));
    body.appendChild(el("div", "card-meta",
      '<span class="estado-badge" data-e="' + esc(it.estado) + '">' + esc(it.estado) + "</span>" +
      (meta.length ? "<span>· " + meta.join(" · ") + "</span>" : "")));

    if (it.defectos && it.defectos.length) {
      body.appendChild(el("div", "defectos", "<b>A tener en cuenta:</b> " + esc(it.defectos.join("; "))));
    }

    var pr = el("div", "price-row");
    pr.innerHTML = '<span class="price">' + money(it.precio_ars) + "</span>" +
      (it.cantidad && it.cantidad > 1 ? '<span class="price-unit">c/u · ' + it.cantidad + " disp.</span>" : "") +
      (it.precio_firme ? '<span class="price-firme">Firme</span>' : "");
    body.appendChild(pr);

    var acts = el("div", "card-actions");
    if (!vendido) {
      var wa = el("a", "wa");
      wa.href = waItem(it); wa.target = "_blank"; wa.rel = "noopener";
      wa.innerHTML = waSVG() + "Consultar";
      acts.appendChild(wa);
    }
    var det = el("button", "btn-detalle", "Detalle");
    det.addEventListener("click", function () { openModal(it); });
    acts.appendChild(det);
    body.appendChild(acts);

    c.appendChild(body);
    return c;
  }

  function waSVG() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.9 5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.6-6c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.5.3-.5c0-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6.7 12a5 5 0 0 0 1 2.5 11 11 0 0 0 4.3 3.8c1.6.7 1.7.5 2 .5a2.5 2.5 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.5-.3z"/></svg>';
  }

  /* ---------- filtros ---------- */
  function buildFiltros() {
    var cats = {};
    ITEMS.forEach(function (it) { cats[it.categoria] = 1; });

    var cCat = document.getElementById("f-categoria");
    var cDisp = document.getElementById("f-disp");
    cCat.appendChild(chip("categoria", "todas", "Todas"));
    ["electrodoméstico", "mueble", "otro"].forEach(function (k) {   // orden fijo: Electro · Muebles · Otros
      if (cats[k]) cCat.appendChild(chip("categoria", k, CAT_LABEL[k] || k));
    });
    cDisp.appendChild(dispToggle());
    syncChips();
  }
  function chip(dim, val, label) {
    var b = el("button", "chip", esc(label));
    b.setAttribute("data-dim", dim); b.setAttribute("data-val", val);
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { filtro[dim] = val; syncChips(); render(); });
    return b;
  }
  function dispToggle() {                          // un solo chip on/off: ocultar vendidos
    var b = el("button", "chip", "Ocultar vendidos");
    b.setAttribute("data-dim", "disp"); b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () {
      filtro.disp = (filtro.disp === "disponibles") ? "todas" : "disponibles";
      b.setAttribute("aria-pressed", filtro.disp === "disponibles" ? "true" : "false");
      render();
    });
    return b;
  }
  function syncChips() {
    document.querySelectorAll(".chip[data-val]").forEach(function (b) {
      b.setAttribute("aria-pressed", filtro[b.getAttribute("data-dim")] === b.getAttribute("data-val") ? "true" : "false");
    });
  }

  /* ---------- render ---------- */
  function render() {
    var cont = document.getElementById("catalogo");
    cont.innerHTML = "";
    var visibles = ITEMS.filter(function (it) {
      return (filtro.categoria === "todas" || it.categoria === filtro.categoria) &&
             (filtro.disp === "todas" || it.estado_venta !== "vendido");
    });

    var totalVend = ITEMS.filter(function (i) { return i.estado_venta === "vendido"; }).length;
    var totalDisp = ITEMS.length - totalVend;
    document.getElementById("tally").innerHTML =
      '<b class="t-disp">' + totalDisp + " disponibles</b> · " +
      '<b class="t-vend">' + totalVend + " vendidos</b>";

    var byAmb = {};
    visibles.forEach(function (it) { (byAmb[it.ambiente] = byAmb[it.ambiente] || []).push(it); });

    // orden de ambientes: (1) las secciones con algo DISPONIBLE van siempre arriba de las
    // totalmente vendidas; (2) dentro de cada grupo, orden FIJO por AMB_ORDEN (no por monto).
    function ambConDisp(amb) { return byAmb[amb].some(function (it) { return it.estado_venta !== "vendido"; }); }
    var ambientes = Object.keys(byAmb).sort(function (a, b) {
      var da = ambConDisp(a) ? 0 : 1, db = ambConDisp(b) ? 0 : 1;
      if (da !== db) return da - db;
      var ia = AMB_ORDEN.indexOf(a), ib = AMB_ORDEN.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    if (!ambientes.length) {
      cont.appendChild(el("p", "count", "No hay ítems con esos filtros."));
      return;
    }

    ambientes.forEach(function (amb) {
      var lista = byAmb[amb].slice().sort(function (a, b) {
        var va = a.estado_venta === "vendido" ? 1 : 0, vb = b.estado_venta === "vendido" ? 1 : 0;
        if (va !== vb) return va - vb;             // vendidos al final
        return b.precio_ars - a.precio_ars;         // mayor precio primero
      });
      var sec = el("section", "ambiente");
      var disp = lista.filter(function (i) { return i.estado_venta !== "vendido"; }).length;
      var head = el("div", "ambiente-head");
      head.innerHTML = "<h2>" + esc(amb) + "</h2>" +
        '<span class="n">' + disp + (disp === 1 ? " disponible" : " disponibles") + "</span>" +
        '<span class="tag">Los Cardales</span>';
      sec.appendChild(head);
      var grid = el("div", "grid");
      lista.forEach(function (it) { grid.appendChild(card(it)); });
      sec.appendChild(grid);
      cont.appendChild(sec);
    });
  }

  /* ---------- modal ---------- */
  var modal = document.getElementById("modal");
  function openModal(it) {
    var vendido = it.estado_venta === "vendido";
    var fnames = it.fotos || [];
    var specs = [];
    if (it.marca) specs.push(["Marca", it.marca]);
    if (it.modelo) specs.push(["Modelo", it.modelo]);
    if (it.antiguedad && !/no especifica/i.test(it.antiguedad)) specs.push(["Antigüedad", it.antiguedad]);
    if (it.medidas) specs.push(["Medidas", it.medidas]);
    specs.push(["Estado", it.estado]);
    if (it.cantidad && it.cantidad > 1) specs.push(["Disponibles", it.cantidad + " unidades"]);

    var html =
      '<button class="modal-close" aria-label="Cerrar">×</button>' +
      '<div class="modal-body">' +
        '<div class="modal-gallery">' +
          '<div class="main">' + (fnames.length ? '<img src="' + esc(fotoSrc(fnames[0], "full")) + '" alt="' + esc(it.nombre) + '">' : '<div class="foto-pendiente"><span class="fp-ico">▦</span><span>' + esc(it.foto_pendiente || "Foto próximamente") + "</span></div>") + "</div>" +
          (fnames.length > 1 ? '<div class="modal-thumbs">' + fnames.map(function (f, i) {
            return '<img data-src="' + esc(fotoSrc(f, "full")) + '" class="' + (i === 0 ? "sel" : "") + '" src="' + esc(fotoSrc(f, "thumb")) + '" alt="">';
          }).join("") + "</div>" : "") +
        "</div>" +
        '<div class="modal-info">' +
          '<span class="stamp-id stencil">' + esc(it.id) + "</span>" +
          (vendido ? ' <span class="estado-badge" style="color:var(--rojo)">Vendido</span>' : "") +
          "<h3>" + esc(it.nombre) + "</h3>" +
          '<p class="m-price">' + money(it.precio_ars) + (it.cantidad > 1 ? " c/u" : "") +
            (it.precio_firme ? ' <span class="price-firme">Precio firme</span>' : "") + "</p>" +
          '<p class="m-desc">' + esc(it.descripcion) + "</p>" +
          (it.defectos && it.defectos.length ? '<div class="m-defectos"><b>A tener en cuenta:</b> ' + esc(it.defectos.join("; ")) + "</div>" : "") +
          '<dl class="modal-specs">' + specs.map(function (s) {
            return "<dt>" + esc(s[0]) + "</dt><dd>" + esc(s[1]) + "</dd>";
          }).join("") + "</dl>" +
          (it.link_specs ? '<p class="link-specs"><a href="' + esc(it.link_specs) + '" target="_blank" rel="noopener">Ficha técnica del fabricante ↗</a></p>' : "") +
        "</div>" +
      "</div>" +
      (vendido ? "" : '<div class="modal-cta"><a class="wa block" href="' + waItem(it) + '" target="_blank" rel="noopener">' + waSVG() + "Consultar por WhatsApp</a></div>");

    var mc = modal.querySelector(".modal-card");
    mc.innerHTML = html;
    mc.querySelector(".modal-close").addEventListener("click", requestClose);
    var main = mc.querySelector(".main img");
    mc.querySelectorAll(".modal-thumbs img").forEach(function (t) {
      t.addEventListener("click", function () {
        if (main) main.src = t.getAttribute("data-src");
        mc.querySelectorAll(".modal-thumbs img").forEach(function (x) { x.classList.remove("sel"); });
        t.classList.add("sel");
      });
    });
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    history.pushState({ modal: it.id }, "");   // 'atrás' de Android cierra el detalle, no la sesión
  }
  function closeModal() {                        // cierre del DOM únicamente
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
  function requestClose() {                      // si el estado activo es del modal, retrocede (dispara popstate)
    if (history.state && history.state.modal) history.back();
    else closeModal();
  }
  window.addEventListener("popstate", function () { if (modal.classList.contains("open")) closeModal(); });
  modal.addEventListener("click", function (e) { if (e.target === modal) requestClose(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("open")) requestClose(); });

  /* ---------- header dinámico ---------- */
  function fillHeader() {
    document.getElementById("site-title").textContent = CFG.titulo_sitio || "Liquidación";
    document.getElementById("site-sub").textContent = CFG.linea_contexto || "";
    var wag = document.getElementById("wa-general");
    wag.href = waURL("Hola, vi el catálogo de la liquidación de Los Cardales y quería consultar.");
    var foot = document.getElementById("wa-footer");
    foot.href = wag.href;
  }

  /* ---------- mapa ---------- */
  function initMapa() {
    if (typeof L === "undefined") return;
    // ENTRADA del Los Cardales Country Club (portón de acceso, NO la casa).
    // Coordenada del portón confirmada por Feña.
    var lat = -34.3156049, lng = -58.9641648;
    var map = L.map("mapa", { scrollWheelZoom: false, attributionControl: true }).setView([lat, lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: "© OpenStreetMap"
    }).addTo(map);
    L.circleMarker([lat, lng], {
      radius: 9, color: "#fff", weight: 3, fillColor: "#1D3A8F", fillOpacity: 1
    }).addTo(map).bindTooltip("Entrada · Los Cardales Country Club", { permanent: true, direction: "top", offset: [0, -8], className: "mapa-tip" });
  }

  /* ---------- init ---------- */
  fillHeader();
  buildFiltros();
  render();
  initMapa();
})();
