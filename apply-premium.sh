#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> Aplicando Mundo Mágico Premium Clean Pack..."

# Si estamos dentro de la carpeta del zip, subimos un nivel y movemos todo
if [ -d src ] && [ -f apply-premium.sh ] && [ "$(basename "$ROOT")" = "MundoMagico-Premium" ]; then
  echo "→ Detectada carpeta anidada, moviendo archivos a la raíz del proyecto..."
  cd ..
  cp -a MundoMagico-Premium/. .
  rm -rf MundoMagico-Premium
  ROOT="$(pwd)"
  cd "$ROOT"
fi

# También soportar si el zip se extrajo dejando la carpeta
if [ -d MundoMagico-Premium/src ]; then
  echo "→ Aplanando carpeta MundoMagico-Premium..."
  cp -a MundoMagico-Premium/. .
  rm -rf MundoMagico-Premium
fi

# Borrar el zip
echo "→ Borrando el zip..."
rm -f MundoMagico-Premium.zip MundoMagico-NextLevel.zip 2>/dev/null || true

# Crear carpetas necesarias
mkdir -p ./src/types ./src/data ./src/components/games ./public/assets/icons ./tools

# Copiar archivos (si todavía existen en la estructura del pack)
echo "→ Actualizando archivos..."
[ -f src/types/game.ts ] && cp -f src/types/game.ts ./src/types/game.ts || true
[ -f src/data/gameModes.ts ] && cp -f src/data/gameModes.ts ./src/data/gameModes.ts || true
[ -f src/components/PlayerSetup.tsx ] && cp -f src/components/PlayerSetup.tsx ./src/components/PlayerSetup.tsx || true
[ -f src/components/games/BubblePopGame.tsx ] && cp -f src/components/games/BubblePopGame.tsx ./src/components/games/BubblePopGame.tsx || true
[ -f src/components/games/SentenceTrainGame.tsx ] && cp -f src/components/games/SentenceTrainGame.tsx ./src/components/games/SentenceTrainGame.tsx || true
[ -f tools/generar_assets.py ] && cp -f tools/generar_assets.py ./tools/generar_assets.py || true
[ -d public/assets/icons ] && cp -rf public/assets/icons/* ./public/assets/icons/ 2>/dev/null || true

chmod +x tools/generar_assets.py 2>/dev/null || true
chmod +x apply-premium.sh 2>/dev/null || true

# Git
echo "→ git add + commit + push..."
git add -A
git status

git commit -m "feat: premium clean pack - 10 juegos, nueva interfaz, BubblePop + SentenceTrain, iconos y generador assets" || echo "(nada nuevo que commitear)"

git push origin main || git push origin master || echo "(no se pudo hacer push)"

echo ""
echo "✅ ¡TODO LISTO! Cambios aplicados, commit y push hechos."
echo ""
echo "Reinicia el servidor con:"
echo "  bun run dev"
echo ""
