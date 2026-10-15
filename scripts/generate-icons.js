import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// High-fidelity SVG of the NURIO logo with squircle white background and gentle soft-pink border
function createLogoSvg(size, paddingPercent = 0.15) {
  const contentSize = size * (1 - 2 * paddingPercent);
  const offset = size * paddingPercent;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background subtle gradient -->
    <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#FFF5F7" />
    </linearGradient>

    <!-- Front Ribbon Gradient -->
    <linearGradient id="grad-front" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
      <stop offset="0%" stop-color="#FF7A95" />
      <stop offset="45%" stop-color="#FF5277" />
      <stop offset="100%" stop-color="#EA335E" />
    </linearGradient>

    <!-- Left Curve Gradient -->
    <linearGradient id="grad-left" x1="0" y1="0.2" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#FF6B8B" />
      <stop offset="70%" stop-color="#F43F5E" />
      <stop offset="100%" stop-color="#E11D48" />
    </linearGradient>

    <!-- Inner fold underside -->
    <linearGradient id="grad-inner" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#FFE0E6" />
      <stop offset="100%" stop-color="#FFB3C2" />
    </linearGradient>

    <!-- Right upright gradient -->
    <linearGradient id="grad-right" x1="0.5" y1="1" x2="0.5" y2="0">
      <stop offset="0%" stop-color="#EA335E" />
      <stop offset="100%" stop-color="#FF859F" />
    </linearGradient>

    <!-- Chat bubble gradient -->
    <linearGradient id="grad-bubble" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF6584" />
      <stop offset="100%" stop-color="#ED3B64" />
    </linearGradient>

    <!-- Drop shadow -->
    <filter id="shadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#9F1239" flood-opacity="0.16" />
    </filter>
  </defs>

  <!-- Solid white full-bleed base to prevent black/gray letter fallback on iOS Safari and Android -->
  <rect width="${size}" height="${size}" fill="#FFFFFF" />

  <!-- Inner squircle frame -->
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${Math.round(size * 0.22)}" fill="url(#bg-grad)" stroke="#FFE4E8" stroke-width="${Math.max(1, Math.round(size * 0.015))}" />

  <!-- NURIO Ribbon & Chat Bubble scaled inside content area -->
  <g transform="translate(${offset}, ${offset}) scale(${contentSize / 100})">
    <!-- Group with drop shadow -->
    <g filter="url(#shadow)">
      <!-- Layer 1: Right upright ribbon -->
      <path d="M60 40 L70 34 C74 31 79 34 79 39 L79 78 C79 83 75 86 70 86 L60 81 Z" fill="url(#grad-right)" opacity="0.92" />

      <!-- Layer 2: Folded inner page / bottom-left loop reverse side -->
      <path d="M24 64 C24 72 28 78 36 80 L52 83 C48 76 44 71 36 71 L26 71 Z" fill="url(#grad-inner)" />

      <!-- Layer 3: Left sweeping ribbon arm -->
      <path d="M27 18 C20 18 14 24 14 32 L14 66 C14 77 20 83 30 83 L49 83 C52 83 54 80 52 77 C48 71 42 66 33 66 L25 66 C23 66 22 64 22 62 L22 32 C22 27 25 24 28 24 Z" fill="url(#grad-left)" />

      <!-- Layer 4: Diagonal ribbon slash -->
      <path d="M24 18 C20 18 16 22 17 27 L22 38 L63 83 C66 86 71 86 74 83 L77 80 C80 77 80 72 76 68 L29 19 C28 18 26 18 24 18 Z" fill="url(#grad-front)" />

      <!-- Layer 5: Top-right speech bubble -->
      <rect x="56" y="15" width="32" height="23" rx="7.5" fill="url(#grad-bubble)" />
      <path d="M74 37 L80 45 C80.8 45.8 82 44.2 82 44.2 L82 37 Z" fill="url(#grad-bubble)" />
      
      <!-- 3 dots inside chat bubble -->
      <circle cx="65" cy="26.5" r="2.3" fill="white" />
      <circle cx="72" cy="26.5" r="2.3" fill="white" />
      <circle cx="79" cy="26.5" r="2.3" fill="white" />
    </g>
  </g>
</svg>
`;
}

// Maskable icon with safe zone of 20%
function createMaskableSvg(size) {
  return createLogoSvg(size, 0.20);
}

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Apple Touch Icon (180x180) - iOS Safari
  const appleSvg = Buffer.from(createLogoSvg(180, 0.14));
  await sharp(appleSvg).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 2. PWA 192x192 - Android / Desktop standard
  const pwa192Svg = Buffer.from(createLogoSvg(192, 0.14));
  await sharp(pwa192Svg).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 3. PWA 512x512 - High-resolution splash & launcher
  const pwa512Svg = Buffer.from(createLogoSvg(512, 0.14));
  await sharp(pwa512Svg).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 4. PWA Maskable 512x512 - Android adaptive launcher icon
  const maskableSvg = Buffer.from(createMaskableSvg(512));
  await sharp(maskableSvg).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 5. Favicon 32x32 & 48x48
  const fav32Svg = Buffer.from(createLogoSvg(32, 0.10));
  await sharp(fav32Svg).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Generated favicon-32x32.png');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
