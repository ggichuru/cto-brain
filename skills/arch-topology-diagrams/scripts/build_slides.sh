#!/usr/bin/env bash
# build_slides.sh — render a Marp + Mermaid deck to HTML (always) and PDF (if a
# headless browser is present). Honest converter-ladder: never fabricates a PDF
# it could not produce. See ../references/slide-format.md.
#
# Usage: build_slides.sh <deck.md> [out_dir]
#   out_dir defaults to the deck's directory.
set -euo pipefail

IN="${1:?usage: build_slides.sh <deck.md> [out_dir]}"
[ -f "$IN" ] || { echo "[slides] error: $IN not found" >&2; exit 2; }
OUT_DIR="${2:-$(dirname "$IN")}"
mkdir -p "$OUT_DIR"
base="$(basename "$IN")"; base="${base%.md}"
OUT_HTML="$OUT_DIR/$base.html"
OUT_PDF="$OUT_DIR/$base.pdf"

# 1. resolve a Marp renderer ------------------------------------------------
if command -v marp >/dev/null 2>&1; then
  MARP=(marp)
elif command -v npx >/dev/null 2>&1; then
  echo "[slides] marp not installed — using 'npx @marp-team/marp-cli' (first run downloads it)"
  MARP=(npx --yes @marp-team/marp-cli@latest)
else
  echo "[slides] error: need either 'marp' or 'npx' (node) to render. Install node, or 'npm i -g @marp-team/marp-cli'." >&2
  exit 3
fi

# 2. HTML (no browser engine needed) ---------------------------------------
echo "[slides] rendering HTML → $OUT_HTML"
"${MARP[@]}" --html "$IN" -o "$OUT_HTML"

# 3. inject the Mermaid client-side bootstrap before </body> ----------------
# Marp emits ```mermaid fences as <pre><code class="language-mermaid">…</code></pre>.
# We turn each into a <pre class="mermaid"> node and run mermaid on them.
read -r -d '' BOOTSTRAP <<'HTML' || true
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
  const blocks = document.querySelectorAll('code.language-mermaid, pre > code.language-mermaid');
  blocks.forEach((code) => {
    const pre = code.closest('pre') || code;
    const holder = document.createElement('pre');
    holder.className = 'mermaid';
    holder.textContent = code.textContent;
    pre.replaceWith(holder);
  });
  mermaid.run({ querySelector: '.mermaid' }).catch((e) => console.error('mermaid:', e));
</script>
HTML

if grep -q '</body>' "$OUT_HTML"; then
  # insert before the last </body>
  tmp="$(mktemp)"
  awk -v ins="$BOOTSTRAP" '
    { lines[NR]=$0 }
    END {
      for (i=1;i<=NR;i++) {
        if (i==NR) { } # placeholder
      }
      # find last </body>
      last=0; for (i=1;i<=NR;i++) if (lines[i] ~ /<\/body>/) last=i;
      for (i=1;i<=NR;i++) { if (i==last) print ins; print lines[i]; }
    }' "$OUT_HTML" > "$tmp" && mv "$tmp" "$OUT_HTML"
else
  printf '%s\n' "$BOOTSTRAP" >> "$OUT_HTML"
fi
echo "[slides] injected Mermaid client-side renderer"

# world-readable so a static file-server (nginx/caddy) running as another
# user can serve it — marp/npx can emit 0600 under a tight umask (→ 403).
chmod a+r "$OUT_HTML" 2>/dev/null || true

# 4. PDF if a headless browser exists --------------------------------------
BROWSER=""
for b in chromium chromium-browser google-chrome google-chrome-stable chrome; do
  if command -v "$b" >/dev/null 2>&1; then BROWSER="$b"; break; fi
done

if [ -n "$BROWSER" ]; then
  echo "[slides] printing PDF via $BROWSER (headless) → $OUT_PDF"
  # --run-all-compositor-stages-before-draw + a virtual-time budget so mermaid
  # finishes rendering before the print snapshot is taken.
  "$BROWSER" --headless=new --no-sandbox --disable-gpu \
    --virtual-time-budget=8000 \
    --print-to-pdf="$OUT_PDF" "file://$(cd "$OUT_DIR" && pwd)/$base.html" \
    >/dev/null 2>&1 && echo "[slides] PDF ✓ $OUT_PDF" \
    || echo "[slides] PDF print failed under $BROWSER — open $OUT_HTML and Save-as-PDF (Ctrl/Cmd-P)"
else
  echo "[slides] no headless browser found (chromium/chrome) — PDF not generated."
  echo "[slides]   → open $OUT_HTML in a browser and Save-as-PDF (Ctrl/Cmd-P)."
fi

echo "[slides] done. HTML: $OUT_HTML"
