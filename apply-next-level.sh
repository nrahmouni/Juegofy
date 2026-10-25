#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
echo "==> Aplicando Mundo Magico Next Level en $ROOT"
# If running from zip extraction folder that contains a nested Juegofy, flatten
if [ -d Juegofy/src ]; then
  cp -a Juegofy/. .
  rm -rf Juegofy
fi
rm -f MundoMagico-NextLevel.zip MundoMagico-Premium.zip 2>/dev/null || true
git add -A
git status
git commit -m "feat: premium hub slides, vehicle pilot, magic puzzle, richer modes" || echo "(nada nuevo que commitear)"
git push origin main
echo "==> Listo. Repo actualizado en main."
