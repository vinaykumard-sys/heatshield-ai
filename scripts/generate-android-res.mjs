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
    rawScanlines[y * (1 + stride)] = 0;
    rgbaBuffer.copy(rawScanlines, y * (1 + stride) + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idat, iendChunk]);
}

function renderLauncherIcon(size, isRound = false) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.46;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (isRound) {
        if (dist > radius) {
          if (dist < radius + 1.2) {
            // antialiasing edge
            const alpha = Math.max(0, Math.min(255, (radius + 1.2 - dist) / 1.2 * 255));
            buf[idx] = 6; buf[idx+1] = 13; buf[idx+2] = 30; buf[idx+3] = Math.round(alpha);
          }
          continue;
        }
      } else {
        // Squircle / rounded rect
        const cornerR = size * 0.22;
        const qx = Math.max(0, Math.abs(dx) - (size * 0.44 - cornerR));
        const qy = Math.max(0, Math.abs(dy) - (size * 0.44 - cornerR));
        const cDist = Math.sqrt(qx * qx + qy * qy);
        if (cDist > cornerR) {
          if (cDist < cornerR + 1.2) {
            const alpha = Math.max(0, Math.min(255, (cornerR + 1.2 - cDist) / 1.2 * 255));
            buf[idx] = 6; buf[idx+1] = 13; buf[idx+2] = 30; buf[idx+3] = Math.round(alpha);
          }
          continue;
        }
      }

      // Background gradient: navy #060D1E to #0f2552
      const grad = (y / size);
      const bgR = Math.round(6 + grad * 12);
      const bgG = Math.round(13 + grad * 24);
      const bgB = Math.round(30 + grad * 55);

      // Inner shield / flame emblem
      const shieldH = size * 0.58;
      const shieldW = size * 0.50;
      const top = cy - shieldH * 0.42;
      const bot = cy + shieldH * 0.58;

      let inShield = false;
      if (y >= top && y <= bot) {
        let halfW;
        const taperY = cy + shieldH * 0.1;
        if (y <= taperY) {
          halfW = shieldW * 0.45;
        } else {
          const prog = (y - taperY) / (bot - taperY);
          halfW = shieldW * 0.45 * Math.cos(prog * Math.PI * 0.5);
        }
        if (Math.abs(dx) <= halfW) {
          inShield = true;
        }
      }

      if (inShield) {
        // Flame / energy core: cyan #38bdf8 to vibrant amber #f59e0b
        const innerGrad = (y - top) / shieldH;
        buf[idx] = Math.round(30 + innerGrad * 215);     // 30 -> 245
        buf[idx + 1] = Math.round(150 + innerGrad * 10);  // 150 -> 160
        buf[idx + 2] = Math.round(248 - innerGrad * 230); // 248 -> 18
        buf[idx + 3] = 255;
      } else {
        buf[idx] = bgR;
        buf[idx + 1] = bgG;
        buf[idx + 2] = bgB;
        buf[idx + 3] = 255;
      }
    }
  }

  return encodePNG(size, size, buf);
}

const densities = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const targetDirs = [
  path.resolve('android-src/res'),
  path.resolve('android-res')
];

for (const base of targetDirs) {
  for (const { dir, size } of densities) {
    const fullDir = path.join(base, dir);
    fs.mkdirSync(fullDir, { recursive: true });

    const squareIcon = renderLauncherIcon(size, false);
    fs.writeFileSync(path.join(fullDir, 'ic_launcher.png'), squareIcon);

    const roundIcon = renderLauncherIcon(size, true);
    fs.writeFileSync(path.join(fullDir, 'ic_launcher_round.png'), roundIcon);
  }
}

console.log('Successfully generated all mipmap launcher icons in android-src/res and android-res!');
