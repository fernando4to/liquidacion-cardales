#!/usr/bin/env bash
# Verificación de estándares móviles/UX del sitio (CLAUDE.md §12).
# Falla (exit 1) si: falta og:image absoluta · algún archivo en docs/assets/fotos >250 KB ·
# la suma de *-thumb.webp >4 MB · queda alguna referencia .jpg viva en app.js/index.html.
# Nota: se excluyen del grep de .jpg (1) og.jpg (asset social, único .jpg permitido) y
# (2) el blob <script id="catalogo-data"> (datos espejo de inventario.json; app.js los mapea a WebP).
set -uo pipefail
cd "$(dirname "$0")/.."

FAIL=0
ok(){ echo "  OK  $1"; }
bad(){ echo "  XX  $1"; FAIL=1; }

echo "1) og:image absoluta"
if grep -Eq '<meta property="og:image" content="https://[^"]+/assets/og\.jpg"' docs/index.html; then
  ok "og:image con URL absoluta presente"
else
  bad "falta og:image con URL absoluta"
fi
if [ -f docs/assets/og.jpg ]; then
  ogkb=$(( $(wc -c < docs/assets/og.jpg) / 1024 ))
  if [ "$ogkb" -le 300 ]; then ok "og.jpg existe (${ogkb} KB, <=300)"; else bad "og.jpg pesa ${ogkb} KB (>300)"; fi
else
  bad "og.jpg no existe"
fi

echo "2) ningun archivo en docs/assets/fotos >250 KB"
big=$(find docs/assets/fotos -type f -size +250k)
if [ -z "$big" ]; then ok "todos <=250 KB"; else bad "hay archivos >250 KB:"; echo "$big"; fi

echo "3) suma de *-thumb.webp <=4 MB"
sumkb=$(find docs/assets/fotos -name '*-thumb.webp' | python3 -c 'import sys,os; print(int(sum(os.path.getsize(l.strip()) for l in sys.stdin)//1024))')
if [ "${sumkb:-99999}" -le 4096 ]; then ok "thumbs suma ${sumkb} KB (<=4096)"; else bad "thumbs suma ${sumkb} KB (>4096)"; fi

echo "4) sin referencia .jpg viva (excluye og.jpg y el blob de datos)"
appjpg=$(grep -nF '.jpg' docs/assets/js/app.js || true)
htmljpg=$(grep '\.jpg' docs/index.html | grep -v catalogo-data | grep -v 'og\.jpg' || true)
if [ -z "$appjpg" ] && [ -z "$htmljpg" ]; then
  ok "sin .jpg vivo en app.js/index.html"
else
  bad ".jpg vivo detectado:"; [ -n "$appjpg" ] && echo "  app.js: $appjpg"; [ -n "$htmljpg" ] && echo "  index.html: $htmljpg"
fi

echo
if [ "$FAIL" -eq 0 ]; then echo "RESULTADO: OK"; else echo "RESULTADO: FALLA"; fi
exit "$FAIL"
