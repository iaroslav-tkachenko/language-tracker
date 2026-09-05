# App icon validation report

Date: 2026-09-05

## Automated results

| File                                     | Format | Dimensions | Alpha channel | Result |
| ---------------------------------------- | ------ | ---------: | ------------- | ------ |
| `language-tracker-icon-1024.png`         | PNG    |  1024×1024 | No            | Pass   |
| `language-tracker-icon-512.png`          | PNG    |    512×512 | No            | Pass   |
| `language-tracker-icon-192.png`          | PNG    |    192×192 | No            | Pass   |
| `language-tracker-icon-maskable-512.png` | PNG    |    512×512 | No            | Pass   |
| `apple-touch-icon-180.png`               | PNG    |    180×180 | No            | Pass   |
| `favicon-32.png`                         | PNG    |      32×32 | No            | Pass   |
| `icon-preview-sheet.png`                 | PNG    |  1800×1600 | No            | Pass   |

The source and exported SVG files match byte-for-byte. The SVG has
`viewBox="0 0 1024 1024"`, contains no embedded raster image, and opens through
the render pipeline without an SVG parse error.

## Visual results

- Checked at 32, 48, 64, 180, 192, and 512 px.
- Checked on white, light-gray, black, and dark-navy surroundings.
- Checked in square, circle, Android-style squircle, and rounded-square masks.
- Checked with a 40%-radius maskable safe-zone overlay and an outer 10% crop
  allowance.
- No clipped symbol elements, white edge halos, blurred source raster, or random
  transparent pixels were observed.
- The full title is retained in PWA and Apple exports. The 32 px favicon uses the
  symbol-only adaptation because the two-line title is not legible at that size.

## Scope confirmation

The PWA manifest, service worker, production application, database, and
`src/app/icon.svg` were not changed.
