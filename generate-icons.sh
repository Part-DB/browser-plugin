#!/usr/bin/env bash
# Generates PNG icons from icon.svg
# Requires: ImageMagick (convert), Inkscape, or rsvg-convert
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SVG="$SCRIPT_DIR/icon.svg"
SIZES=(16 32 48 128)

generate_with_inkscape() {
    inkscape --export-type=png \
        --export-width="$1" --export-height="$1" \
        --export-filename="$SCRIPT_DIR/icon-$1.png" \
        "$SVG" 2>/dev/null
}

generate_with_rsvg() {
    rsvg-convert -w "$1" -h "$1" -f png "$SVG" -o "$SCRIPT_DIR/icon-$1.png"
}

generate_with_convert() {
    convert -background none -resize "${1}x${1}" "$SVG" "$SCRIPT_DIR/icon-$1.png"
}

if command -v inkscape &>/dev/null; then
    TOOL="inkscape"
elif command -v rsvg-convert &>/dev/null; then
    TOOL="rsvg-convert"
elif command -v convert &>/dev/null; then
    TOOL="convert"
else
    echo "Error: No SVG converter found. Install one of: inkscape, librsvg2-bin, imagemagick"
    exit 1
fi

echo "Using: $TOOL"

for size in "${SIZES[@]}"; do
    case "$TOOL" in
        inkscape)     generate_with_inkscape "$size" ;;
        rsvg-convert) generate_with_rsvg     "$size" ;;
        convert)      generate_with_convert  "$size" ;;
    esac
    echo "Generated icon-${size}.png"
done

echo "Done."
