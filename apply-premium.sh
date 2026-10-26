#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Aplicando Magic Island + arquitectura..."

if [ -d MundoMagico-Premium ]; then
  cp -a MundoMagico-Premium/. .
  rm -rf MundoMagico-Premium
fi

mkdir -p src/game/scenes src/game/systems src/components/games src/hooks src/types src/data

cp -f src/game/EventBus.ts ./src/game/ 2>/dev/null || true
cp -f src/game/scenes/MainScene.ts ./src/game/scenes/ 2>/dev/null || true
cp -f src/components/games/MagicIslandGame.tsx ./src/components/games/ 2>/dev/null || true
cp -f src/components/games/SchoolMysteryGame.tsx ./src/components/games/ 2>/dev/null || true
cp -f src/hooks/useGameContent.ts ./src/hooks/ 2>/dev/null || true
cp -f src/types/learning.ts ./src/types/ 2>/dev/null || true
cp -f src/data/vocabV2.ts ./src/data/ 2>/dev/null || true

rm -f MundoMagico-Premium.zip 2>/dev/null || true

git add -A
git commit -m "feat: Magic Island prototype (Phaser 3 + React) + i18n architecture + SchoolMystery" || true
git push origin main || git push origin master || true

echo "✅ Listo."
echo "Instala Phaser:  bun add phaser"
echo "Reinicia:        bun run dev"
