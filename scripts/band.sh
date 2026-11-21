#!/bin/sh
# Adds the black akv band under every published photo and video (macOS, uses Swift).
# Clean originals live in incoming/originals (kept out of Git); results go to public/.
#   sh scripts/band.sh photos   — photos and video posters
#   sh scripts/band.sh videos   — videos (slow: re-encodes each file)
# Then run: sh scripts/make-thumbs.sh
set -e
tmp=$(mktemp -d)
build() { cat scripts/band/Logo.swift "scripts/band/$1.swift" > "$tmp/main.swift"; swiftc -O "$tmp/main.swift" -o "$tmp/$1" 2>/dev/null; }
case "$1" in
  photos)
    build photos
    "$tmp/photos" incoming/originals public/media/portfolio
    "$tmp/photos" incoming/originals/video public/media/portfolio/video ;;
  videos)
    build videos
    for f in incoming/originals/video/*.mp4; do "$tmp/videos" "$f" "public/media/portfolio/video/$(basename "$f")"; done ;;
  *) echo "usage: sh scripts/band.sh photos|videos"; exit 1 ;;
esac
rm -rf "$tmp"
