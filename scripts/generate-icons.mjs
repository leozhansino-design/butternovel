// Script to generate all website icons from a source image
// Usage: node scripts/generate-icons.mjs <source-image-path>

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function generateIcons(sourcePath) {
  if (!sourcePath) {
    console.error('Usage: node scripts/generate-icons.mjs <source-image-path>');
    process.exit(1);
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source image not found: ${sourcePath}`);
    process.exit(1);
  }

  console.log(`Generating icons from: ${sourcePath}`);

  const sourceBuffer = fs.readFileSync(sourcePath);

  // Generate icon-512.png (512x512) for PWA
  console.log('Generating icon-512.png...');
  await sharp(sourceBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'icon-512.png'));

  // Generate icon-192.png (192x192) for PWA
  console.log('Generating icon-192.png...');
  await sharp(sourceBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'icon-192.png'));

  // Generate apple-touch-icon.png (180x180)
  console.log('Generating apple-touch-icon.png...');
  await sharp(sourceBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'apple-touch-icon.png'));

  // Generate favicon sizes
  const faviconSizes = [16, 32, 48];

  // Generate 32x32 favicon.png (most common)
  console.log('Generating favicon.png (32x32)...');
  await sharp(sourceBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon.png'));

  // Generate favicon.ico (multi-size ICO is complex, we'll use 32x32 PNG converted to ICO format)
  // For proper ICO support, we generate individual sizes
  console.log('Generating favicon-16.png...');
  await sharp(sourceBuffer)
    .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon-16.png'));

  console.log('Generating favicon-32.png...');
  await sharp(sourceBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon-32.png'));

  console.log('Generating favicon-48.png...');
  await sharp(sourceBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon-48.png'));

  // Copy 32x32 as favicon.ico (browsers accept PNG in .ico extension)
  console.log('Generating favicon.ico...');
  await sharp(sourceBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'src', 'app', 'favicon.ico'));

  // Generate OG image (1200x630) - Open Graph for social sharing
  console.log('Generating og-image.png (1200x630)...');
  await sharp(sourceBuffer)
    .resize(1200, 630, { fit: 'contain', background: { r: 255, g: 214, b: 107, alpha: 1 } }) // Butter yellow background
    .png()
    .toFile(path.join(projectRoot, 'public', 'og-image.png'));

  console.log('\n✅ All icons generated successfully!');
  console.log('\nGenerated files:');
  console.log('  - public/icon-512.png (PWA)');
  console.log('  - public/icon-192.png (PWA)');
  console.log('  - public/apple-touch-icon.png');
  console.log('  - public/favicon.png');
  console.log('  - public/favicon-16.png');
  console.log('  - public/favicon-32.png');
  console.log('  - public/favicon-48.png');
  console.log('  - public/og-image.png (Social sharing)');
  console.log('  - src/app/favicon.ico');
}

const sourcePath = process.argv[2];
generateIcons(sourcePath).catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
