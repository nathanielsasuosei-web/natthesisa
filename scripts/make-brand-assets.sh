#!/usr/bin/env bash
#
# Regenerates every web asset from the master artwork.
#
#   public/branding/logo-original.jpg   the untouched upload (2000×2000)
#
# Run it after replacing the master:  bash scripts/make-brand-assets.sh
#
# Requires ImageMagick (`convert`). The crops are named in
# `src/config/branding.ts`, which is the only place the app refers to them.

set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
brand="$root/public/branding"
master="$brand/logo-original.jpg"
app="$root/src/app"

if [ ! -f "$master" ]; then
  echo "Missing $master — that file is the master copy." >&2
  exit 1
fi

echo "Master: $(identify -format '%wx%h %m' "$master")"

# Web sizes of the full picture.
convert "$master" -resize 1024x1024 -strip -quality 82 "$brand/logo.webp"
convert "$master" -resize 1024x1024 -strip -quality 86 "$brand/logo-1024.jpg"

# The Vibe Coding program cover: the laptop, the code wall and the headline.
convert "$master" -crop 2000x1250+0+375 +repage -resize 1200x750 -strip -quality 88 "$brand/vibe-coding.jpg"

# Link previews (Open Graph / Twitter): 1200×630, cropped to the laptop and the
# headline. Everything below the laptop is trimmed, which also drops the tool
# logos along the bottom edge.
convert "$master" -crop 2000x1050+0+475 +repage -resize 1200x630 -strip -quality 88 "$brand/og.jpg"

# App icons. Next.js picks these up by filename from `src/app/`.
convert "$master" -resize 512x512 -strip -quality 92 "$brand/icon-512.png"
convert "$master" -resize 192x192 -strip -quality 92 "$brand/icon-192.png"
convert "$master" -resize 180x180 -strip -quality 92 "$brand/apple-icon.png"
cp "$brand/icon-512.png" "$app/icon.png"
cp "$brand/apple-icon.png" "$app/apple-icon.png"
convert "$master" -resize 32x32 -strip "$app/favicon.ico"

echo
echo "Written:"
ls -la "$brand"
