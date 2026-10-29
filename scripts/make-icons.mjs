// Erzeugt die App-Symbole (PNG + SVG) ohne zusätzliche Abhängigkeiten.
// Motiv: weißer Abhak-Kreis mit Häkchen auf iOS-Blau.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const BG = [0, 122, 255];
const out = new URL('../public/', import.meta.url);
mkdirSync(out, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

function png(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const c = size / 2;
  const r = size * 0.3, ring = size * 0.055, stroke = size * 0.06;
  const P = [[0.385, 0.51], [0.465, 0.59], [0.625, 0.42]].map(([x, y]) => [x * size, y * size]);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const px = x + 0.5, py = y + 0.5;
      const dRing = Math.abs(Math.hypot(px - c, py - c) - r) - ring / 2;
      const dCheck = Math.min(segDist(px, py, ...P[0], ...P[1]), segDist(px, py, ...P[1], ...P[2])) - stroke / 2;
      const a = Math.max(0, Math.min(1, 0.5 - Math.min(dRing, dCheck)));
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = Math.round(BG[0] + (255 - BG[0]) * a);
      raw[i + 1] = Math.round(BG[1] + (255 - BG[1]) * a);
      raw[i + 2] = Math.round(BG[2] + (255 - BG[2]) * a);
      raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(new URL('apple-touch-icon.png', out), png(180));
writeFileSync(new URL('pwa-192.png', out), png(192));
writeFileSync(new URL('pwa-512.png', out), png(512));
writeFileSync(
  new URL('icon.svg', out),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#007AFF"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-width="5.5"/>
  <path d="M38.5 51l8 8 16-17" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`,
);
console.log('Symbole erzeugt.');
