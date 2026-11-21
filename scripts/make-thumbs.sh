#!/bin/sh
# Writes lighter copies of every portfolio photo to public/media/portfolio/thumbs/
# (longest side 1200 px). Cards, the Work valley and album grids load these; the
# full-size photo is only loaded in the full-screen viewer. macOS (uses sips).
# Run from the project root after adding photos:  sh scripts/make-thumbs.sh
set -e
src=public/media/portfolio
out="$src/thumbs"
mkdir -p "$out"
for f in "$src"/*.jpg; do
  name=$(basename "$f")
  [ -f "$out/$name" ] && [ "$out/$name" -nt "$f" ] && continue
  sips -Z 1200 -s formatOptions 76 "$f" --out "$out/$name" >/dev/null
done
echo "thumbs: $(ls "$out" | wc -l | tr -d ' ') images"
