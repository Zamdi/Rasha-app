/**
 * Generates all required PWA icon sizes from an inline SVG.
 * Run once: node generate-icons.mjs
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Inline SVG — teal card with white "R"
const svgTemplate = (size) => {
  const rx = Math.round(size * 0.18)
  const fontSize = Math.round(size * 0.52)
  const y = Math.round(size * 0.70)
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#12454B"/>
  <text x="${size / 2}" y="${y}" font-family="Arial Black, Arial, sans-serif" font-weight="900"
    font-size="${fontSize}" fill="#F9F6EF" text-anchor="middle">R</text>
</svg>`)
}

const outDir = join('public', 'icons')
mkdirSync(outDir, { recursive: true })

for (const size of sizes) {
  const outPath = join(outDir, `icon-${size}x${size}.png`)
  await sharp(svgTemplate(size))
    .resize(size, size)
    .png()
    .toFile(outPath)
  console.log(`✓ ${outPath}`)
}

console.log('\nAll icons generated.')
