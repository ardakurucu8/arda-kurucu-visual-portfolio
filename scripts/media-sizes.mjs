// Writes src/data/mediaSizes.json: width/height of every portfolio JPEG (the visible
// picture, i.e. without the black download band underneath — see scripts/band.sh), so project
// galleries can lay photos out in justified rows before the images have loaded.
// Runs automatically before `npm run dev` and `npm run build`.
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const folder = 'public/media/portfolio';
const out = 'src/data/mediaSizes.json';
const BAND = 1.07; // keep in step with scripts/band/Logo.swift and --band in src/styles.css

function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    // SOF0–SOF15 carry the frame size (skipping DHT, JPG and DAC markers).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return {h: buffer.readUInt16BE(offset + 5), w: buffer.readUInt16BE(offset + 7)};
    }
    offset += 2 + length;
  }
  return null;
}

const sizes = {};
for (const name of readdirSync(folder).sort()) {
  if (!/\.jpe?g$/i.test(name)) continue;
  const size = jpegSize(readFileSync(join(folder, name)));
  if (size) sizes[`/media/portfolio/${name}`] = [size.w, Math.round(size.h / BAND)];
}
writeFileSync(out, `${JSON.stringify(sizes, null, 1)}\n`);
console.log(`media-sizes: ${Object.keys(sizes).length} images`);
