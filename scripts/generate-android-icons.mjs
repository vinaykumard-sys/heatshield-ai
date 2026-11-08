import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Palette constants
const PALETTE = {
  bgDark: '#060D1E',
  bgNavy: '#0B1329',
  bgNavyLight: '#111C3D',
  cyanLight: '#38BDF8',
  cyanPrimary: '#0284C7',
  cyanGlow: '#06B6D4',
  amberLight: '#FCD34D',
  amberPrimary: '#F59E0B',
  amberGlow: '#FEF08A',
  orangeHeat: '#EA580C',
  white: '#FFFFFF',
  textMuted: '#94A3B8'
};

/**
 * Creates high-fidelity SVG for HeatShield AI Shield Icon
 * @param {number} size Output dimension (e.g. 48, 72, 96, 144, 192, 512, 1024)
 * @param {object} options
 * @param {boolean} options.isForeground If true, renders transparent adaptive foreground with 66dp safe zone
 * @param {boolean} options.isRound If true, renders circular launcher icon
 */
export function createShieldSvg(size, { isForeground = false, isRound = false } = {}) {
  const viewBoxSize = 512;
  const center = viewBoxSize / 2;

  // Safe area scaling:
  // For adaptive foreground: safe zone is central 66% (338px diameter). Shield fits within ~270w x 330h.
  // For standard standalone icon: scale ~0.88 for perfect visual balance with rounded container.
  const scale = isForeground ? 0.80 : 0.88;
  const translateY = isForeground ? 10 : 8;

  let bgMarkup = '';
  if (!isForeground) {
    if (isRound) {
      bgMarkup = `
        <circle cx="${center}" cy="${center}" r="${center}" fill="url(#bgGradient)" />
        <circle cx="${center}" cy="${center}" r="${center - 2}" stroke="url(#borderGlow)" stroke-width="3" opacity="0.6" fill="none" />
      `;
    } else {
      bgMarkup = `
        <rect width="${viewBoxSize}" height="${viewBoxSize}" rx="112" ry="112" fill="url(#bgGradient)" />
        <rect x="2" y="2" width="${viewBoxSize - 4}" height="${viewBoxSize - 4}" rx="110" ry="110" stroke="url(#borderGlow)" stroke-width="3" opacity="0.55" fill="none" />
      `;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${size}" height="${size}" fill="none">
    <defs>
      <!-- Deep Cyber-Navy Radial Gradient -->
      <radialGradient id="bgGradient" cx="50%" cy="38%" r="65%">
        <stop offset="0%" stop-color="#142145" />
        <stop offset="55%" stop-color="#0B1329" />
        <stop offset="100%" stop-color="#040814" />
      </radialGradient>

      <!-- Ambient Core Glow behind shield -->
      <radialGradient id="ambientFlare" cx="50%" cy="46%" r="42%">
        <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.25" />
        <stop offset="45%" stop-color="#0284C7" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#0284C7" stop-opacity="0" />
      </radialGradient>

      <!-- Solar Core Radial Glow -->
      <radialGradient id="sunFlare" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FEF08A" stop-opacity="1" />
        <stop offset="35%" stop-color="#FCD34D" stop-opacity="0.95" />
        <stop offset="70%" stop-color="#F59E0B" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#EA580C" stop-opacity="0" />
      </radialGradient>

      <!-- Outer Shield Thermal Border Gradient -->
      <linearGradient id="thermalBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D" />
        <stop offset="25%" stop-color="#F59E0B" />
        <stop offset="55%" stop-color="#EA580C" />
        <stop offset="80%" stop-color="#0284C7" />
        <stop offset="100%" stop-color="#38BDF8" />
      </linearGradient>

      <!-- Left Facet Gradient -->
      <linearGradient id="shieldLeftFacet" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E2B4D" />
        <stop offset="60%" stop-color="#0F182E" />
        <stop offset="100%" stop-color="#090E1D" />
      </linearGradient>

      <!-- Right Facet Gradient -->
      <linearGradient id="shieldRightFacet" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#15203D" />
        <stop offset="60%" stop-color="#0A1021" />
        <stop offset="100%" stop-color="#04070F" />
      </linearGradient>

      <!-- Thermal Core Teardrop Gradient -->
      <linearGradient id="coreFlame" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="18%" stop-color="#FEF08A" />
        <stop offset="45%" stop-color="#F59E0B" />
        <stop offset="75%" stop-color="#EA580C" />
        <stop offset="100%" stop-color="#C2410C" />
      </linearGradient>

      <!-- Border Subtle Outline Glow -->
      <linearGradient id="borderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38BDF8" />
        <stop offset="50%" stop-color="#0284C7" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#F59E0B" />
      </linearGradient>

      <!-- Filter for Soft Radiant Core Glow -->
      <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    ${bgMarkup}

    <!-- Embedded Scaled & Centered Vector Shield Group -->
    <g transform="translate(${center}, ${center + translateY}) scale(${scale}) translate(-256, -256)">
      <!-- Background Ambient Glow behind shield -->
      <circle cx="256" cy="246" r="180" fill="url(#ambientFlare)" />

      <!-- Concentric Orbital Telemetry Rings -->
      <circle cx="256" cy="256" r="218" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="4 8" opacity="0.35" />
      <circle cx="256" cy="256" r="188" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="16 12" opacity="0.25" />

      <!-- Outer Shield Shadow / Ambient Base -->
      <path d="M256 52 L418 108 C418 274 256 442 256 442 C256 442 94 274 94 108 Z"
            fill="#030611" />

      <!-- Shield Facets -->
      <!-- Left Facet (Illuminated Cyber Navy) -->
      <path d="M256 60 L102 112 C102 268 256 430 256 430 V60 Z"
            fill="url(#shieldLeftFacet)" />

      <!-- Right Facet (Deep Shadow Obsidian) -->
      <path d="M256 60 L410 112 C410 268 256 430 256 430 V60 Z"
            fill="url(#shieldRightFacet)" />

      <!-- Precision Internal Meridian Line -->
      <line x1="256" y1="64" x2="256" y2="424" stroke="#38BDF8" stroke-width="2" stroke-dasharray="8 6" opacity="0.55" />

      <!-- Protective Thermal Perimeter Contour -->
      <path d="M256 52 L418 108 C418 274 256 442 256 442 C256 442 94 274 94 108 Z"
            stroke="url(#thermalBorder)"
            stroke-width="14"
            stroke-linejoin="round"
            stroke-linecap="round" />

      <!-- Inner Crisp Hi-Tech Accent Rim -->
      <path d="M256 72 L396 120 C396 258 256 398 256 398 C256 398 116 258 116 120 Z"
            stroke="#0284C7"
            stroke-width="3"
            stroke-linejoin="round"
            opacity="0.7" />

      <!-- Top Deflection Sensor Nodes / Notches -->
      <line x1="220" y1="62" x2="292" y2="62" stroke="#FEF08A" stroke-width="3" stroke-linecap="round" opacity="0.9" />
      <circle cx="256" cy="88" r="4.5" fill="#38BDF8" />
      <circle cx="148" cy="130" r="3.5" fill="#F59E0B" />
      <circle cx="364" cy="130" r="3.5" fill="#F59E0B" />

      <!-- Thermal Deflection Curved Arcs (Radar Wave front) -->
      <path d="M166 186 C192 162 222 150 256 150 C290 150 320 162 346 186"
            stroke="#38BDF8"
            stroke-width="6"
            stroke-linecap="round"
            opacity="0.9" />
      <path d="M190 214 C210 196 232 188 256 188 C280 188 302 196 322 214"
            stroke="#FCD34D"
            stroke-width="4.5"
            stroke-linecap="round"
            opacity="0.95" />

      <!-- Solar Aura Glow -->
      <circle cx="256" cy="276" r="66" fill="url(#sunFlare)" opacity="0.85" />

      <!-- Central Dynamic Radiant Heat Core (Thermal Flame / AI Core) -->
      <path d="M256 180 C270 216 304 238 304 282 C304 316 278 342 256 350 C234 342 208 316 208 282 C208 238 242 216 256 180 Z"
            fill="url(#coreFlame)"
            filter="url(#coreGlow)" />

      <!-- Inner Solar Core Flare Arc -->
      <path d="M256 220 C264 244 286 258 286 288 C286 310 268 328 256 334 C244 328 226 310 226 288 C226 258 248 244 256 220 Z"
            fill="#FEF08A"
            opacity="0.75" />

      <!-- Pure White-Hot Fusion Nucleus / AI Sensor Diamond -->
      <polygon points="256,268 266,282 256,296 246,282" fill="#FFFFFF" />
      <circle cx="256" cy="282" r="5" fill="#FFFFFF" />

      <!-- Lower Cooling Shield Vector Arcs -->
      <path d="M198 334 C216 354 235 366 256 374 C277 366 296 354 314 334"
            stroke="#38BDF8"
            stroke-width="4.5"
            stroke-linecap="round"
            opacity="0.8" />
      <path d="M222 366 C233 378 244 386 256 392 C268 386 279 378 290 366"
            stroke="#0284C7"
            stroke-width="3"
            stroke-linecap="round"
            opacity="0.9" />

      <!-- Defense Coordinates / Pips -->
      <circle cx="162" cy="288" r="4" fill="#38BDF8" opacity="0.8" />
      <circle cx="350" cy="288" r="4" fill="#38BDF8" opacity="0.8" />
      <circle cx="256" cy="414" r="5" fill="#F59E0B" />
    </g>
  </svg>`;
}

/**
 * Creates high-fidelity vertical Splash Screen SVG (1080x1920)
 */
export function createSplashSvg(width = 1080, height = 1920) {
  const cx = width / 2;
  const logoCenterY = height * 0.40; // 768px from top

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none">
    <defs>
      <!-- Deep Cyber Navy Background Gradient -->
      <radialGradient id="splashBg" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#111D3B" />
        <stop offset="45%" stop-color="#080F21" />
        <stop offset="100%" stop-color="#030610" />
      </radialGradient>

      <!-- Center Ambient Halo -->
      <radialGradient id="splashCenterHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#0284C7" stop-opacity="0.25" />
        <stop offset="40%" stop-color="#06B6D4" stop-opacity="0.10" />
        <stop offset="100%" stop-color="#0284C7" stop-opacity="0" />
      </radialGradient>

      <!-- Solar Flare -->
      <radialGradient id="splashSunFlare" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FEF08A" stop-opacity="1" />
        <stop offset="35%" stop-color="#FCD34D" stop-opacity="0.9" />
        <stop offset="70%" stop-color="#F59E0B" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#EA580C" stop-opacity="0" />
      </radialGradient>

      <!-- Thermal Perimeter Gradient -->
      <linearGradient id="splashThermalBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D" />
        <stop offset="25%" stop-color="#F59E0B" />
        <stop offset="55%" stop-color="#EA580C" />
        <stop offset="80%" stop-color="#0284C7" />
        <stop offset="100%" stop-color="#38BDF8" />
      </linearGradient>

      <!-- Facets -->
      <linearGradient id="splashShieldLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E2B4D" />
        <stop offset="60%" stop-color="#0F182E" />
        <stop offset="100%" stop-color="#090E1D" />
      </linearGradient>

      <linearGradient id="splashShieldRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#15203D" />
        <stop offset="60%" stop-color="#0A1021" />
        <stop offset="100%" stop-color="#04070F" />
      </linearGradient>

      <!-- Flame Core -->
      <linearGradient id="splashCoreFlame" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="18%" stop-color="#FEF08A" />
        <stop offset="45%" stop-color="#F59E0B" />
        <stop offset="75%" stop-color="#EA580C" />
        <stop offset="100%" stop-color="#C2410C" />
      </linearGradient>

      <!-- Soft Glow Filter -->
      <filter id="splashGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#splashBg)" />

    <!-- Ambient Orbital & Grid Elements -->
    <circle cx="${cx}" cy="${logoCenterY}" r="480" fill="url(#splashCenterHalo)" />
    <circle cx="${cx}" cy="${logoCenterY}" r="380" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="6 12" opacity="0.25" />
    <circle cx="${cx}" cy="${logoCenterY}" r="440" stroke="#0284C7" stroke-width="1" stroke-dasharray="24 16" opacity="0.18" />
    <circle cx="${cx}" cy="${logoCenterY}" r="520" stroke="#F59E0B" stroke-width="1" stroke-dasharray="8 24" opacity="0.15" />

    <!-- Shield Symbol -->
    <g transform="translate(${cx}, ${logoCenterY}) scale(0.95) translate(-256, -256)">
      <!-- Outer Shield Shadow -->
      <path d="M256 52 L418 108 C418 274 256 442 256 442 C256 442 94 274 94 108 Z"
            fill="#030611" />

      <!-- Left Facet -->
      <path d="M256 60 L102 112 C102 268 256 430 256 430 V60 Z"
            fill="url(#splashShieldLeft)" />

      <!-- Right Facet -->
      <path d="M256 60 L410 112 C410 268 256 430 256 430 V60 Z"
            fill="url(#splashShieldRight)" />

      <!-- Meridian -->
      <line x1="256" y1="64" x2="256" y2="424" stroke="#38BDF8" stroke-width="2" stroke-dasharray="8 6" opacity="0.55" />

      <!-- Outer Thermal Border -->
      <path d="M256 52 L418 108 C418 274 256 442 256 442 C256 442 94 274 94 108 Z"
            stroke="url(#splashThermalBorder)"
            stroke-width="14"
            stroke-linejoin="round"
            stroke-linecap="round" />

      <!-- Inner Rim -->
      <path d="M256 72 L396 120 C396 258 256 398 256 398 C256 398 116 258 116 120 Z"
            stroke="#0284C7"
            stroke-width="3"
            stroke-linejoin="round"
            opacity="0.7" />

      <!-- Nodes & Notches -->
      <line x1="220" y1="62" x2="292" y2="62" stroke="#FEF08A" stroke-width="3" stroke-linecap="round" opacity="0.9" />
      <circle cx="256" cy="88" r="4.5" fill="#38BDF8" />
      <circle cx="148" cy="130" r="3.5" fill="#F59E0B" />
      <circle cx="364" cy="130" r="3.5" fill="#F59E0B" />

      <!-- Thermal Deflection Waves -->
      <path d="M166 186 C192 162 222 150 256 150 C290 150 320 162 346 186"
            stroke="#38BDF8"
            stroke-width="6"
            stroke-linecap="round"
            opacity="0.9" />
      <path d="M190 214 C210 196 232 188 256 188 C280 188 302 196 322 214"
            stroke="#FCD34D"
            stroke-width="4.5"
            stroke-linecap="round"
            opacity="0.95" />

      <!-- Solar Aura -->
      <circle cx="256" cy="276" r="66" fill="url(#splashSunFlare)" opacity="0.85" />

      <!-- Flame / AI Core -->
      <path d="M256 180 C270 216 304 238 304 282 C304 316 278 342 256 350 C234 342 208 316 208 282 C208 238 242 216 256 180 Z"
            fill="url(#splashCoreFlame)"
            filter="url(#splashGlow)" />

      <!-- Inner Flare Arc -->
      <path d="M256 220 C264 244 286 258 286 288 C286 310 268 328 256 334 C244 328 226 310 226 288 C226 258 248 244 256 220 Z"
            fill="#FEF08A"
            opacity="0.75" />

      <!-- White Hot Core -->
      <polygon points="256,268 266,282 256,296 246,282" fill="#FFFFFF" />
      <circle cx="256" cy="282" r="5" fill="#FFFFFF" />

      <!-- Lower Cooling Waves -->
      <path d="M198 334 C216 354 235 366 256 374 C277 366 296 354 314 334"
            stroke="#38BDF8"
            stroke-width="4.5"
            stroke-linecap="round"
            opacity="0.8" />
      <path d="M222 366 C233 378 244 386 256 392 C268 386 279 378 290 366"
            stroke="#0284C7"
            stroke-width="3"
            stroke-linecap="round"
            opacity="0.9" />

      <circle cx="162" cy="288" r="4" fill="#38BDF8" opacity="0.8" />
      <circle cx="350" cy="288" r="4" fill="#38BDF8" opacity="0.8" />
      <circle cx="256" cy="414" r="5" fill="#F59E0B" />
    </g>

    <!-- App Title Typography -->
    <text x="${cx}" y="${logoCenterY + 310}" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="52" fill="#FFFFFF" letter-spacing="6">
      HEATSHIELD <tspan fill="#38BDF8">AI</tspan>
    </text>

    <!-- Subtitle / Tagline -->
    <text x="${cx}" y="${logoCenterY + 372}" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="20" fill="#38BDF8" letter-spacing="6" opacity="0.9">
      HYPERLOCAL HEAT RESILIENCE
    </text>

    <!-- Status Divider -->
    <g transform="translate(${cx}, ${logoCenterY + 418})">
      <line x1="-120" y1="0" x2="-25" y2="0" stroke="#1E293B" stroke-width="2" />
      <circle cx="0" cy="0" r="4" fill="#F59E0B" />
      <line x1="25" y1="0" x2="120" y2="0" stroke="#1E293B" stroke-width="2" />
    </g>

    <!-- Bottom Status / Mesh Telemetry pill -->
    <g transform="translate(${cx}, ${height - 180})">
      <rect x="-210" y="-24" width="420" height="48" rx="24" fill="#0B1329" stroke="#1E293B" stroke-width="1.5" />
      <circle cx="-160" cy="0" r="5" fill="#10B981" />
      <text x="-140" y="6" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="16" fill="#94A3B8" letter-spacing="2">
        AI PREDICTIVE SAFETY MESH
      </text>
    </g>

    <!-- Bottom Footer Version -->
    <text x="${cx}" y="${height - 90}" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="14" fill="#475569" letter-spacing="3">
      OFFLINE-FIRST NEURAL TELEMETRY
    </text>
  </svg>`;
}

/**
 * Creates multi-image .ico buffer from an array of PNG buffers with sizes
 */
function createIco(images) {
  // images: array of { size: 16|32|48, buffer: Buffer }
  const count = images.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // Number of images

  let currentOffset = dataOffset;
  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Offset
    entries.push(entry);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(img => img.buffer)]);
}

/**
 * Main Asset Generation Pipeline
 */
async function generateAllAssets() {
  console.log('⚡ Starting HeatShield AI Android App Icon & Asset Generation...');

  const rootDir = process.cwd();
  const androidResDir = path.join(rootDir, 'android-res');
  const mobileAssetsDir = path.join(rootDir, 'mobile', 'assets');
  const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');
  const publicIconsDir = path.join(rootDir, 'public', 'icons');
  const publicDir = path.join(rootDir, 'public');

  // Ensure directories exist
  const dirs = [
    path.join(androidResDir, 'mipmap-mdpi'),
    path.join(androidResDir, 'mipmap-hdpi'),
    path.join(androidResDir, 'mipmap-xhdpi'),
    path.join(androidResDir, 'mipmap-xxhdpi'),
    path.join(androidResDir, 'mipmap-xxxhdpi'),
    path.join(androidResDir, 'mipmap-anydpi-v26'),
    path.join(androidResDir, 'drawable'),
    path.join(androidResDir, 'values'),
    mobileAssetsDir,
    publicDownloadsDir,
    publicIconsDir
  ];

  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }

  // 1. Android Standard Mipmap Densities
  const densities = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 }
  ];

  console.log('📦 Rendering Android Mipmap Icons (standard & round)...');
  for (const d of densities) {
    // Standard icon
    const standardSvg = createShieldSvg(d.size, { isForeground: false, isRound: false });
    const standardPng = await sharp(Buffer.from(standardSvg)).png().toBuffer();
    const standardPath = path.join(androidResDir, d.name, 'ic_launcher.png');
    fs.writeFileSync(standardPath, standardPng);

    // Round icon
    const roundSvg = createShieldSvg(d.size, { isForeground: false, isRound: true });
    const roundPng = await sharp(Buffer.from(roundSvg)).png().toBuffer();
    const roundPath = path.join(androidResDir, d.name, 'ic_launcher_round.png');
    fs.writeFileSync(roundPath, roundPng);

    console.log(`  ✓ ${d.name}/ic_launcher.png (${d.size}x${d.size}, ${standardPng.length} B)`);
    console.log(`  ✓ ${d.name}/ic_launcher_round.png (${d.size}x${d.size}, ${roundPng.length} B)`);
  }

  // 2. Android Adaptive Icon XML (API 26+)
  console.log('📄 Writing Android Adaptive Icon XML configs...');
  const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;

  fs.writeFileSync(path.join(androidResDir, 'mipmap-anydpi-v26', 'ic_launcher.xml'), adaptiveIconXml);
  fs.writeFileSync(path.join(androidResDir, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), adaptiveIconXml);
  console.log('  ✓ mipmap-anydpi-v26/ic_launcher.xml');
  console.log('  ✓ mipmap-anydpi-v26/ic_launcher_round.xml');

  // 3. Android Adaptive Background Vector & Colors
  const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0B1329"
        android:pathData="M0,0h108v108h-108z"/>
</vector>
`;
  fs.writeFileSync(path.join(androidResDir, 'drawable', 'ic_launcher_background.xml'), backgroundXml);
  console.log('  ✓ drawable/ic_launcher_background.xml');

  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0B1329</color>
</resources>
`;
  fs.writeFileSync(path.join(androidResDir, 'values', 'colors.xml'), colorsXml);
  console.log('  ✓ values/colors.xml');

  // 4. Android Adaptive Foreground (512x512)
  console.log('🎨 Generating Adaptive Foreground (512x512 with safe-zone margin)...');
  const foregroundSvg = createShieldSvg(512, { isForeground: true });
  const foregroundPng = await sharp(Buffer.from(foregroundSvg)).png().toBuffer();
  fs.writeFileSync(path.join(androidResDir, 'drawable', 'ic_launcher_foreground.png'), foregroundPng);
  console.log(`  ✓ drawable/ic_launcher_foreground.png (512x512, ${foregroundPng.length} B)`);

  // 5. Android 12+ SplashScreen Logo (512x512)
  console.log('🚀 Generating SplashScreen Logo (512x512)...');
  const splashLogoSvg = createShieldSvg(512, { isForeground: true });
  const splashLogoPng = await sharp(Buffer.from(splashLogoSvg)).png().toBuffer();
  fs.writeFileSync(path.join(androidResDir, 'drawable', 'splash_logo.png'), splashLogoPng);
  console.log(`  ✓ drawable/splash_logo.png (512x512, ${splashLogoPng.length} B)`);

  // 6. Mobile Assets: icon.png (1024x1024), adaptive-icon.png (512x512), splash.png (1080x1920)
  console.log('📱 Generating Mobile App Assets (React Native / Expo)...');
  const mobile1024Svg = createShieldSvg(1024, { isForeground: false, isRound: false });
  const mobile1024Png = await sharp(Buffer.from(mobile1024Svg)).png().toBuffer();
  fs.writeFileSync(path.join(mobileAssetsDir, 'icon.png'), mobile1024Png);
  console.log(`  ✓ mobile/assets/icon.png (1024x1024, ${mobile1024Png.length} B)`);

  fs.writeFileSync(path.join(mobileAssetsDir, 'adaptive-icon.png'), foregroundPng);
  console.log(`  ✓ mobile/assets/adaptive-icon.png (512x512, ${foregroundPng.length} B)`);

  console.log('🌊 Rendering High-Definition Splash Screen (1080x1920)...');
  const splashSvg = createSplashSvg(1080, 1920);
  const splashPng = await sharp(Buffer.from(splashSvg)).png().toBuffer();
  fs.writeFileSync(path.join(mobileAssetsDir, 'splash.png'), splashPng);
  console.log(`  ✓ mobile/assets/splash.png (1080x1920, ${splashPng.length} B)`);

  // 7. Public Downloads app-icon.png
  console.log('🌐 Generating Public Web & PWA assets...');
  fs.writeFileSync(path.join(publicDownloadsDir, 'app-icon.png'), mobile1024Png);
  console.log(`  ✓ public/downloads/app-icon.png (1024x1024, ${mobile1024Png.length} B)`);

  // 8. Public PWA & Favicon Icons
  const pwa512Png = await sharp(Buffer.from(createShieldSvg(512, { isForeground: false }))).png().toBuffer();
  const pwa192Png = await sharp(Buffer.from(createShieldSvg(192, { isForeground: false }))).png().toBuffer();
  const pwa96Png = await sharp(Buffer.from(createShieldSvg(96, { isForeground: false }))).png().toBuffer();
  const pwa48Png = await sharp(Buffer.from(createShieldSvg(48, { isForeground: false }))).png().toBuffer();
  const pwa32Png = await sharp(Buffer.from(createShieldSvg(32, { isForeground: false }))).png().toBuffer();
  const pwa16Png = await sharp(Buffer.from(createShieldSvg(16, { isForeground: false }))).png().toBuffer();

  fs.writeFileSync(path.join(publicIconsDir, 'icon-512.png'), pwa512Png);
  fs.writeFileSync(path.join(publicIconsDir, 'icon-192.png'), pwa192Png);
  fs.writeFileSync(path.join(publicIconsDir, 'icon-96.png'), pwa96Png);
  fs.writeFileSync(path.join(publicIconsDir, 'icon-48.png'), pwa48Png);
  console.log('  ✓ public/icons/ (512, 192, 96, 48)');

  // Favicon .ico with 16, 32, 48 embedded PNGs
  const icoBuffer = createIco([
    { size: 16, buffer: pwa16Png },
    { size: 32, buffer: pwa32Png },
    { size: 48, buffer: pwa48Png }
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log(`  ✓ public/favicon.ico (${icoBuffer.length} B)`);

  // Also sync into android-src/res for standalone Android build compatibility
  const androidSrcResDir = path.join(rootDir, 'android-src', 'res');
  if (fs.existsSync(path.join(rootDir, 'android-src'))) {
    console.log('🔄 Mirroring assets to android-src/res for direct build toolchain compatibility...');
    for (const d of densities) {
      const targetDir = path.join(androidSrcResDir, d.name);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(path.join(androidResDir, d.name, 'ic_launcher.png'), path.join(targetDir, 'ic_launcher.png'));
      fs.copyFileSync(path.join(androidResDir, d.name, 'ic_launcher_round.png'), path.join(targetDir, 'ic_launcher_round.png'));
    }
    const targetAnyDpi = path.join(androidSrcResDir, 'mipmap-anydpi-v26');
    fs.mkdirSync(targetAnyDpi, { recursive: true });
    fs.copyFileSync(path.join(androidResDir, 'mipmap-anydpi-v26', 'ic_launcher.xml'), path.join(targetAnyDpi, 'ic_launcher.xml'));
    fs.copyFileSync(path.join(androidResDir, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), path.join(targetAnyDpi, 'ic_launcher_round.xml'));

    const targetDrawable = path.join(androidSrcResDir, 'drawable');
    fs.mkdirSync(targetDrawable, { recursive: true });
    fs.copyFileSync(path.join(androidResDir, 'drawable', 'ic_launcher_foreground.png'), path.join(targetDrawable, 'ic_launcher_foreground.png'));
    fs.copyFileSync(path.join(androidResDir, 'drawable', 'ic_launcher_background.xml'), path.join(targetDrawable, 'ic_launcher_background.xml'));
    fs.copyFileSync(path.join(androidResDir, 'drawable', 'splash_logo.png'), path.join(targetDrawable, 'splash_logo.png'));
    console.log('  ✓ Mirrored to android-src/res');
  }

  // 9. Automated Verification
  console.log('\n🔍 Verifying generated assets...');
  const verifyList = [
    { p: path.join(androidResDir, 'mipmap-mdpi', 'ic_launcher.png'), w: 48, h: 48 },
    { p: path.join(androidResDir, 'mipmap-hdpi', 'ic_launcher.png'), w: 72, h: 72 },
    { p: path.join(androidResDir, 'mipmap-xhdpi', 'ic_launcher.png'), w: 96, h: 96 },
    { p: path.join(androidResDir, 'mipmap-xxhdpi', 'ic_launcher.png'), w: 144, h: 144 },
    { p: path.join(androidResDir, 'mipmap-xxxhdpi', 'ic_launcher.png'), w: 192, h: 192 },
    { p: path.join(androidResDir, 'drawable', 'ic_launcher_foreground.png'), w: 512, h: 512 },
    { p: path.join(androidResDir, 'drawable', 'splash_logo.png'), w: 512, h: 512 },
    { p: path.join(mobileAssetsDir, 'icon.png'), w: 1024, h: 1024 },
    { p: path.join(mobileAssetsDir, 'adaptive-icon.png'), w: 512, h: 512 },
    { p: path.join(mobileAssetsDir, 'splash.png'), w: 1080, h: 1920 },
    { p: path.join(publicDownloadsDir, 'app-icon.png'), w: 1024, h: 1024 },
    { p: path.join(publicIconsDir, 'icon-512.png'), w: 512, h: 512 },
    { p: path.join(publicIconsDir, 'icon-192.png'), w: 192, h: 192 }
  ];

  for (const item of verifyList) {
    const meta = await sharp(item.p).metadata();
    if (meta.width !== item.w || meta.height !== item.h) {
      throw new Error(`Dimension mismatch for ${item.p}: got ${meta.width}x${meta.height}, expected ${item.w}x${item.h}`);
    }
  }
  console.log('  ✓ All 13 image assets verified with exact pixel dimensions.');

  console.log('\n✨ All Android app icons, splash screens, and vector assets successfully generated and verified!');
}

generateAllAssets().catch(err => {
  console.error('Error during asset generation:', err);
  process.exit(1);
});
