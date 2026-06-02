# Tauri Icons

Place the following icon files here (copy/convert from `build/` directory):

- `32x32.png` - 32×32 PNG
- `128x128.png` - 128×128 PNG
- `128x128@2x.png` - 256×256 PNG (retina)
- `icon.icns` - macOS icon bundle (copy from `build/icon.icns`)
- `icon.ico` - Windows icon (copy from `build/icon.ico`)

Run `npx @tauri-apps/cli icon build/icon.png` to auto-generate all sizes from a single source PNG.
