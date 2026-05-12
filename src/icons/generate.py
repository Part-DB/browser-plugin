#!/usr/bin/env python3
"""Generates PNG icons from scratch using only Python stdlib."""
import struct
import zlib
import os

SIZES = [16, 32, 48, 128]
BG = (26, 102, 53)    # #1a6635
WHITE = (255, 255, 255)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def create_png(width, height, pixels):
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))

    raw = bytearray()
    for y in range(height):
        raw += b'\x00'
        for x in range(width):
            raw += bytes(pixels[y * width + x])

    idat = chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


def draw_icon(size):
    pixels = [BG] * (size * size)
    s = size / 128.0

    def px(x, y, color):
        if 0 <= x < size and 0 <= y < size:
            pixels[y * size + x] = color

    def rect(x, y, w, h, color):
        for dy in range(h):
            for dx in range(w):
                px(x + dx, y + dy, color)

    def sc(v):
        return max(1, round(v * s))

    if size >= 32:
        # Chip body
        rect(sc(36), sc(36), sc(56), sc(56), WHITE)

        # Pins top
        rect(sc(48), sc(22), sc(8), sc(14), WHITE)
        rect(sc(72), sc(22), sc(8), sc(14), WHITE)
        # Pins bottom
        rect(sc(48), sc(92), sc(8), sc(14), WHITE)
        rect(sc(72), sc(92), sc(8), sc(14), WHITE)
        # Pins left
        rect(sc(22), sc(48), sc(14), sc(8), WHITE)
        rect(sc(22), sc(72), sc(14), sc(8), WHITE)
        # Pins right
        rect(sc(92), sc(48), sc(14), sc(8), WHITE)
        rect(sc(92), sc(72), sc(14), sc(8), WHITE)

        # Upload arrow: shaft
        rect(sc(59), sc(62), sc(10), sc(18), BG)

        # Upload arrow: triangle (M64 46 L76 62 H52 Z)
        apex_x = round(64 * s)
        apex_y = round(46 * s)
        left_x = round(52 * s)
        right_x = round(76 * s)
        base_y = round(62 * s)
        span = base_y - apex_y
        if span > 0:
            for dy in range(span + 1):
                t = dy / span
                xl = round(apex_x + (left_x - apex_x) * t)
                xr = round(apex_x + (right_x - apex_x) * t)
                rect(xl, apex_y + dy, max(1, xr - xl), 1, BG)
    else:
        # 16 px: simple white square with green arrow
        rect(2, 2, size - 4, size - 4, WHITE)
        mid = size // 2
        # Arrowhead
        h_range = range(int(size * 0.15), int(size * 0.55))
        total = int(size * 0.55) - int(size * 0.15)
        for i, y in enumerate(h_range):
            if total:
                w = round((i / total) * (size * 0.4))
                for x in range(mid - w, mid + w + 1):
                    px(x, y, BG)
        # Shaft
        sw = max(1, round(size * 0.2))
        rect(mid - sw // 2, int(size * 0.5), sw, int(size * 0.3), BG)

    return pixels


for sz in SIZES:
    data = create_png(sz, sz, draw_icon(sz))
    path = os.path.join(SCRIPT_DIR, f'icon-{sz}.png')
    with open(path, 'wb') as f:
        f.write(data)
    print(f'Generated {path}  ({len(data)} bytes)')
