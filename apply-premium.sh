#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Aplicando Premium Pack (SVG icons)..."

if [ -d MundoMagico-Premium ]; then
  cp -a MundoMagico-Premium/. .
  rm -rf MundoMagico-Premium
fi

mkdir -p src/types src/data src/components/common src/components/games public/assets/icons tools

cp -f src/types/game.ts ./src/types/ 2>/dev/null || true
cp -f src/data/gameModes.ts ./src/data/ 2>/dev/null || true
cp -f src/components/common/GameIcons.tsx ./src/components/common/ 2>/dev/null || true
cp -f src/components/PlayerSetup.tsx ./src/components/ 2>/dev/null || true

rm -f MundoMagico-Premium.zip 2>/dev/null || true

git add -A
git commit -m "feat: premium pack - SVG animated icons instead of emojis, cleaner 10-game UI" || true
git push origin main || git push origin master || true

echo "✅ Listo. Reinicia: bun run dev"
