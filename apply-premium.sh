#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Aplicando Fase 1 (i18n) + ErrorBoundary + DressUp mejorado..."

if [ -d MundoMagico-Premium ]; then
  cp -a MundoMagico-Premium/. .
  rm -rf MundoMagico-Premium
fi

mkdir -p src/types src/hooks src/components/games src/components

cp -f src/types/learning.ts ./src/types/ 2>/dev/null || true
cp -f src/hooks/useGameContent.ts ./src/hooks/ 2>/dev/null || true
cp -f src/components/GameErrorBoundary.tsx ./src/components/ 2>/dev/null || true
cp -f src/components/games/DressUpGame.tsx ./src/components/games/ 2>/dev/null || true
cp -f src/components/games/SchoolMysteryGame.tsx ./src/components/games/ 2>/dev/null || true
cp -f src/components/games/MagicIslandGame.tsx ./src/components/games/ 2>/dev/null || true
cp -f src/game/EventBus.ts ./src/game/ 2>/dev/null || true
cp -f src/game/scenes/MainScene.ts ./src/game/scenes/ 2>/dev/null || true

rm -f MundoMagico-Premium.zip 2>/dev/null || true

git add -A
git commit -m "feat: i18n safe architecture + GameErrorBoundary + improved DressUp drag-drop" || true
git push origin main || git push origin master || true

echo "✅ Listo."
echo "En GameCanvas envuelve los juegos con <GameErrorBoundary onBackToMenu={onExitGame}>"
