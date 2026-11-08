import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const rawScanlines = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    rawScanlines[y * (1 + stride)] = 0; // filter 0
    rgbaBuffer.copy(rawScanlines, y * (1 + stride) + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idat, iendChunk]);
}

// 5x7 bitmap font for simple crisp text in splash screen
const FONT_5X7 = {
  'H': [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
  'E': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F],
  'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
  'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  'S': [0x0F, 0x10, 0x10, 0x0E, 0x01, 0x01, 0x1E],
  'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
  'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
  'D': [0x1E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1E],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  'M': [0x11, 0x1B, 0x15, 0x11, 0x11, 0x11, 0x11],
  'R': [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
  'F': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
  'Y': [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
  'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
  'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
  'C': [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E],
  '-': [0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00],
  '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x0C, 0x0C],
};

function drawPixel(buf, w, h, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
  const srcA = a / 255;
  const dstA = buf[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA > 0) {
    buf[idx] = Math.round((r * srcA + buf[idx] * dstA * (1 - srcA)) / outA);
    buf[idx + 1] = Math.round((g * srcA + buf[idx + 1] * dstA * (1 - srcA)) / outA);
    buf[idx + 2] = Math.round((b * srcA + buf[idx + 2] * dstA * (1 - srcA)) / outA);
    buf[idx + 3] = Math.round(outA * 255);
  }
}

function drawText(buf, w, h, text, startX, startY, scale, r, g, b, a = 255) {
  let curX = startX;
  const upper = text.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    const bitmap = FONT_5X7[char] || FONT_5X7[' '];
    for (let row = 0; row < 7; row++) {
      const bits = bitmap[row];
      for (let col = 0; col < 5; col++) {
        if ((bits >> (4 - col)) & 1) {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              drawPixel(buf, w, h, curX + col * scale + dx, startY + row * scale + dy, r, g, b, a);
            }
          }
        }
      }
    }
    curX += (5 + 1) * scale;
  }
}

// Distance from point to shield boundary
function shieldSDF(px, py, cx, cy, width, height) {
  // Normalize coords relative to center
  const x = Math.abs(px - cx);
  let y = py - cy;
  
  // Top curve / flat top
  const top = cy - height * 0.48;
  const bottom = cy + height * 0.52;
  
  if (py < top - 10 || py > bottom + 10) return 999;
  
  // Shield profile:
  // For y between top and cy + height * 0.05: width is nearly constant with rounded corners
  // Below cy + 0.05: tapers down parabolically to (cx, bottom)
  const halfW = width * 0.42;
  const taperY = cy + height * 0.08;
  
  let allowedW;
  if (py <= taperY) {
    // slight outward bowing
    const ny = (py - top) / (taperY - top);
    allowedW = halfW * (0.92 + 0.08 * Math.sin(ny * Math.PI * 0.5));
  } else {
    const progress = (py - taperY) / (bottom - taperY);
    allowedW = halfW * Math.cos(progress * Math.PI * 0.5);
  }
  
  return x - allowedW;
}

function renderShieldIcon(size, isAdaptiveForeground = false) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const shieldW = size * 0.72;
  const shieldH = size * 0.82;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!isAdaptiveForeground) {
        // Dark navy cosmic gradient background
        const bgGrad = Math.min(1, Math.max(0, (y + x * 0.3) / (size * 1.3)));
        const r = Math.round(7 + 10 * bgGrad);
        const g = Math.round(15 + 20 * bgGrad);
        const b = Math.round(35 + 45 * bgGrad);
        buf[idx] = r;
        buf[idx + 1] = g;
        buf[idx + 2] = b;
        buf[idx + 3] = 255;
      } else {
        // Transparent for adaptive icon foreground or soft dark
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
      }

      // Outer glow around shield
      const dShield = shieldSDF(x, y, cx, cy - size * 0.02, shieldW, shieldH);
      
      // Radial glow from center
      const coreDist = Math.sqrt(dx * dx + (dy + size * 0.05) * (dy + size * 0.05));
      if (coreDist < size * 0.45) {
        const glowIntensity = Math.pow(1 - coreDist / (size * 0.45), 2);
        // Cyan / emerald ambient radiance
        const gr = 16 * glowIntensity;
        const gg = 185 * glowIntensity * 0.6;
        const gb = 129 * glowIntensity * 0.8;
        buf[idx] = Math.min(255, buf[idx] + gr);
        buf[idx + 1] = Math.min(255, buf[idx + 1] + gg);
        buf[idx + 2] = Math.min(255, buf[idx + 2] + gb);
        buf[idx + 3] = Math.max(buf[idx + 3], Math.round(glowIntensity * 180));
      }

      // Shield body
      if (dShield <= 0) {
        // Inside shield
        const gradY = (y - (cy - shieldH * 0.48)) / shieldH;
        // Cyan to emerald gradient: #06B6D4 (6, 182, 212) -> #10B981 (16, 185, 129)
        let sR = 10 + 15 * gradY;
        let sG = 30 + 50 * gradY;
        let sB = 60 + 40 * gradY;

        // Subtle tech grid pattern
        if ((x % 24 < 2) || (y % 24 < 2)) {
          sR += 8; sG += 18; sB += 24;
        }

        // Shield border
        const borderWidth = size * 0.038;
        if (dShield > -borderWidth) {
          const borderNorm = (dShield + borderWidth) / borderWidth;
          // Emerald to Cyan radiant border
          sR = Math.round(6 + (245 - 6) * borderNorm * 0.3);
          sG = Math.round(182 + (255 - 182) * (1 - gradY));
          sB = Math.round(212 + (129 - 212) * gradY);
        }

        buf[idx] = sR;
        buf[idx + 1] = sG;
        buf[idx + 2] = sB;
        buf[idx + 3] = 255;
      } else if (dShield < 4) {
        // Anti-aliased outer edge
        const alpha = Math.max(0, 1 - dShield / 4);
        const edgeR = 6, edgeG = 182, edgeB = 212;
        buf[idx] = Math.round(buf[idx] * (1 - alpha) + edgeR * alpha);
        buf[idx + 1] = Math.round(buf[idx + 1] * (1 - alpha) + edgeG * alpha);
        buf[idx + 2] = Math.round(buf[idx + 2] * (1 - alpha) + edgeB * alpha);
        buf[idx + 3] = Math.max(buf[idx + 3], Math.round(alpha * 255));
      }

      // Sun / Heat Core at (cx, cy - size * 0.06)
      const sunY = cy - size * 0.05;
      const sDist = Math.sqrt(dx * dx + (y - sunY) * (y - sunY));
      const sunR = size * 0.14;

      // Sun rays
      const angle = Math.atan2(y - sunY, dx);
      const rays = Math.sin(angle * 8);
      if (sDist > sunR * 0.9 && sDist < sunR * 1.55 && rays > 0.4) {
        const rayAlpha = Math.sin(((sDist - sunR * 0.9) / (sunR * 0.65)) * Math.PI) * rays;
        // Warm gold/amber radiant ray: #F59E0B (245, 158, 11)
        buf[idx] = Math.min(255, buf[idx] + 245 * rayAlpha);
        buf[idx + 1] = Math.min(255, buf[idx + 1] + 180 * rayAlpha);
        buf[idx + 2] = Math.min(255, buf[idx + 2] + 40 * rayAlpha);
        buf[idx + 3] = 255;
      }

      // Sun core circle
      if (sDist < sunR) {
        const coreNorm = sDist / sunR;
        // Glowing solar core: white-hot center to radiant orange-amber edge
        const cR = Math.round(255 - 15 * coreNorm);
        const cG = Math.round(245 - 85 * coreNorm);
        const cB = Math.round(180 - 150 * coreNorm);
        buf[idx] = cR;
        buf[idx + 1] = cG;
        buf[idx + 2] = cB;
        buf[idx + 3] = 255;
      } else if (sDist < sunR + 3) {
        const aa = 1 - (sDist - sunR) / 3;
        buf[idx] = Math.round(buf[idx] * (1 - aa) + 245 * aa);
        buf[idx + 1] = Math.round(buf[idx + 1] * (1 - aa) + 160 * aa);
        buf[idx + 2] = Math.round(buf[idx + 2] * (1 - aa) + 30 * aa);
        buf[idx + 3] = 255;
      }

      // Heatshield protective arcs below sun: cooling cyan waves
      const arcY = cy + size * 0.16;
      const arcDist = Math.abs(Math.sqrt(dx * dx + (y - arcY) * (y - arcY)) - size * 0.18);
      if (arcDist < size * 0.022 && y > arcY - size * 0.04 && Math.abs(dx) < size * 0.22) {
        const arcAlpha = 1 - arcDist / (size * 0.022);
        buf[idx] = Math.round(buf[idx] * (1 - arcAlpha) + 6 * arcAlpha);
        buf[idx + 1] = Math.round(buf[idx + 1] * (1 - arcAlpha) + 225 * arcAlpha);
        buf[idx + 2] = Math.round(buf[idx + 2] * (1 - arcAlpha) + 245 * arcAlpha);
        buf[idx + 3] = 255;
      }

      const arc2Y = cy + size * 0.24;
      const arc2Dist = Math.abs(Math.sqrt(dx * dx + (y - arc2Y) * (y - arc2Y)) - size * 0.12);
      if (arc2Dist < size * 0.018 && y > arc2Y - size * 0.02 && Math.abs(dx) < size * 0.15) {
        const arc2Alpha = 1 - arc2Dist / (size * 0.018);
        buf[idx] = Math.round(buf[idx] * (1 - arc2Alpha) + 16 * arc2Alpha);
        buf[idx + 1] = Math.round(buf[idx + 1] * (1 - arc2Alpha) + 185 * arc2Alpha);
        buf[idx + 2] = Math.round(buf[idx + 2] * (1 - arc2Alpha) + 129 * arc2Alpha);
        buf[idx + 3] = 255;
      }
    }
  }

  return encodePNG(size, size, buf);
}

function renderSplashScreen(w, h) {
  const buf = Buffer.alloc(w * h * 4);
  const cx = w / 2;
  const cy = h * 0.42;

  // Solid dark background #060D1E
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      // radial spotlight from logo center
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const radGlow = Math.max(0, 1 - d / (w * 0.9));
      
      const r = Math.round(6 + 10 * radGlow);
      const g = Math.round(13 + 25 * radGlow);
      const b = Math.round(30 + 40 * radGlow);
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }

  // Draw logo icon in center
  const iconSize = Math.round(w * 0.42);
  const iconPng = renderShieldIcon(iconSize, false);
  
  // Stamp the icon onto splash
  // Generate icon buffer
  const shieldW = iconSize * 0.72;
  const shieldH = iconSize * 0.82;
  const icx = iconSize / 2;
  const icy = iconSize / 2;

  for (let ly = 0; ly < iconSize; ly++) {
    for (let lx = 0; lx < iconSize; lx++) {
      const targetX = Math.round(cx - iconSize / 2 + lx);
      const targetY = Math.round(cy - iconSize / 2 + ly);
      if (targetX < 0 || targetX >= w || targetY < 0 || targetY >= h) continue;

      const dx = lx - icx;
      const dy = ly - icy;
      const dShield = shieldSDF(lx, ly, icx, icy - iconSize * 0.02, shieldW, shieldH);

      if (dShield <= 0) {
        const gradY = (ly - (icy - shieldH * 0.48)) / shieldH;
        let sR = 10 + 15 * gradY;
        let sG = 30 + 50 * gradY;
        let sB = 60 + 40 * gradY;
        const borderWidth = iconSize * 0.04;
        if (dShield > -borderWidth) {
          const borderNorm = (dShield + borderWidth) / borderWidth;
          sR = Math.round(6 + (245 - 6) * borderNorm * 0.3);
          sG = Math.round(182 + (255 - 182) * (1 - gradY));
          sB = Math.round(212 + (129 - 212) * gradY);
        }
        drawPixel(buf, w, h, targetX, targetY, sR, sG, sB, 255);
      }

      // Sun
      const sunY = icy - iconSize * 0.05;
      const sDist = Math.sqrt(dx * dx + (ly - sunY) * (ly - sunY));
      const sunR = iconSize * 0.14;
      const angle = Math.atan2(ly - sunY, dx);
      const rays = Math.sin(angle * 8);

      if (sDist > sunR * 0.9 && sDist < sunR * 1.55 && rays > 0.4) {
        const rayAlpha = Math.sin(((sDist - sunR * 0.9) / (sunR * 0.65)) * Math.PI) * rays;
        drawPixel(buf, w, h, targetX, targetY, 245, 180, 40, Math.round(rayAlpha * 255));
      }

      if (sDist < sunR) {
        const coreNorm = sDist / sunR;
        const cR = Math.round(255 - 15 * coreNorm);
        const cG = Math.round(245 - 85 * coreNorm);
        const cB = Math.round(180 - 150 * coreNorm);
        drawPixel(buf, w, h, targetX, targetY, cR, cG, cB, 255);
      }

      // Cooling Arcs
      const arcY = icy + iconSize * 0.16;
      const arcDist = Math.abs(Math.sqrt(dx * dx + (ly - arcY) * (ly - arcY)) - iconSize * 0.18);
      if (arcDist < iconSize * 0.025 && ly > arcY - iconSize * 0.04 && Math.abs(dx) < iconSize * 0.22) {
        drawPixel(buf, w, h, targetX, targetY, 6, 225, 245, 255);
      }
    }
  }

  // Text: "HEATSHIELD AI"
  const titleText = "HEATSHIELD AI";
  const titleScale = Math.round(w / 120);
  const titleW = titleText.length * 6 * titleScale;
  drawText(buf, w, h, titleText, Math.round(cx - titleW / 2), Math.round(cy + iconSize * 0.6), titleScale, 255, 255, 255, 255);

  // Subtitle: "SMART HEAT SAFETY FOR YOUR CITY"
  const subText = "SMART HEAT SAFETY FOR YOUR CITY";
  const subScale = Math.max(2, Math.round(titleScale * 0.42));
  const subW = subText.length * 6 * subScale;
  drawText(buf, w, h, subText, Math.round(cx - subW / 2), Math.round(cy + iconSize * 0.6 + 14 * titleScale), subScale, 56, 189, 248, 220);

  return encodePNG(w, h, buf);
}

// Generate all assets
console.log('Generating branded mobile assets...');

const mobileAssetsDir = path.resolve('mobile/assets');
const publicDownloadsDir = path.resolve('public/downloads');
fs.mkdirSync(mobileAssetsDir, { recursive: true });
fs.mkdirSync(publicDownloadsDir, { recursive: true });

// 1. icon.png (512x512)
console.log('Generating icon.png...');
const iconPng = renderShieldIcon(512, false);
fs.writeFileSync(path.join(mobileAssetsDir, 'icon.png'), iconPng);

// 2. adaptive-icon.png (512x512)
console.log('Generating adaptive-icon.png...');
const adaptiveIconPng = renderShieldIcon(512, true);
fs.writeFileSync(path.join(mobileAssetsDir, 'adaptive-icon.png'), adaptiveIconPng);

// 3. splash.png (1080x1920)
console.log('Generating splash.png...');
const splashPng = renderSplashScreen(1080, 1920);
fs.writeFileSync(path.join(mobileAssetsDir, 'splash.png'), splashPng);

// 4. public/downloads/app-icon.png (512x512)
console.log('Copying to public/downloads/app-icon.png...');
fs.writeFileSync(path.join(publicDownloadsDir, 'app-icon.png'), iconPng);

console.log('Successfully generated all mobile branded assets:');
console.log('- mobile/assets/icon.png (' + iconPng.length + ' bytes)');
console.log('- mobile/assets/adaptive-icon.png (' + adaptiveIconPng.length + ' bytes)');
console.log('- mobile/assets/splash.png (' + splashPng.length + ' bytes)');
console.log('- public/downloads/app-icon.png (' + iconPng.length + ' bytes)');
