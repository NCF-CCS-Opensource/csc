#!/usr/bin/env bash
set -euo pipefail

# Generates all Android mipmap launcher icons and splashscreen logos
# from source assets in apps/mobile/assets/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ASSETS="$MOBILE_DIR/assets"
RES="$MOBILE_DIR/android/app/src/main/res"

if ! command -v magick &>/dev/null; then
  echo "Error: ImageMagick (magick) is required but not installed." >&2
  exit 1
fi

echo "Generating Android mipmap icons from $ASSETS to $RES..."

# Mipmap densities: density:legacy_size:adaptive_size
DENSITIES=(
  "mdpi:48:108"
  "hdpi:72:162"
  "xhdpi:96:216"
  "xxhdpi:144:324"
  "xxxhdpi:192:432"
)

for entry in "${DENSITIES[@]}"; do
  IFS=":" read -r density legacy adaptive <<< "$entry"
  MIPMAP_DIR="$RES/mipmap-$density"
  mkdir -p "$MIPMAP_DIR"
  
  # Adaptive layers
  magick "$ASSETS/android-icon-foreground.png" -resize "${adaptive}x${adaptive}" "$MIPMAP_DIR/ic_launcher_foreground.webp"
  magick "$ASSETS/android-icon-background.png" -resize "${adaptive}x${adaptive}" "$MIPMAP_DIR/ic_launcher_background.webp"
  magick "$ASSETS/android-icon-monochrome.png" -resize "${adaptive}x${adaptive}" "$MIPMAP_DIR/ic_launcher_monochrome.webp"
  
  # Legacy square & round icons
  magick "$ASSETS/icon.png" -resize "${legacy}x${legacy}" "$MIPMAP_DIR/ic_launcher.webp"
  magick "$ASSETS/icon.png" -resize "${legacy}x${legacy}" "$MIPMAP_DIR/ic_launcher_round.webp"
  
  echo "  ✓ mipmap-$density: legacy=${legacy}px, adaptive=${adaptive}px"
done

# Splashscreen densities: density:size
SPLASH_DENSITIES=(
  "mdpi:288"
  "hdpi:432"
  "xhdpi:576"
  "xxhdpi:864"
  "xxxhdpi:1152"
)

for entry in "${SPLASH_DENSITIES[@]}"; do
  IFS=":" read -r density size <<< "$entry"
  DRAWABLE_DIR="$RES/drawable-$density"
  mkdir -p "$DRAWABLE_DIR"
  magick "$ASSETS/splash-icon.png" -resize "${size}x${size}" "$DRAWABLE_DIR/splashscreen_logo.png"
  echo "  ✓ drawable-$density/splashscreen_logo.png: ${size}px"
done

echo "Done! All Android launcher and splashscreen assets have been updated."
