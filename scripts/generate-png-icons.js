import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createSolidPNG(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // Deflate
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // No interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None)
  const rowBytes = width * 4;
  const rawScanlines = Buffer.alloc((1 + rowBytes) * height);

  // Draw an orange circle/badge inside with inner white square/icon
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;
  const innerSize = width * 0.22;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0; // Filter byte: 0

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let pxR = 234, pxG = 88, pxB = 12; // #EA580C
      if (dist > radius) {
        // Rounded corners / soft outer
        pxR = r; pxG = g; pxB = b;
      }

      // Inner white POS symbol
      if (Math.abs(dx) <= innerSize && Math.abs(dy) <= innerSize * 0.8) {
        if (Math.abs(dy) <= innerSize * 0.3 && Math.abs(dx) <= innerSize * 0.7) {
          // Display screen
          pxR = 15; pxG = 23; pxB = 42; // dark slate
        } else {
          pxR = 255; pxG = 255; pxB = 255; // white
        }
      }

      rawScanlines[offset++] = pxR;
      rawScanlines[offset++] = pxG;
      rawScanlines[offset++] = pxB;
      rawScanlines[offset++] = 255;
    }
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Generate PNG files
const publicDir = path.resolve('public');
const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const png192 = createSolidPNG(192, 192, 234, 88, 12);
const png512 = createSolidPNG(512, 512, 234, 88, 12);
const pngApple = createSolidPNG(180, 180, 234, 88, 12);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

console.log('PNG PWA icons generated successfully!');
