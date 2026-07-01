// Gera os ícones PNG do PWA (sem dependências). Desenha um "planner":
// fundo azul com três linhas de tarefa (checkbox + barra) em branco.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const BG = [47, 111, 224, 255]; // #2F6FE0
const WHITE = [255, 255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const px = new Uint8Array(size * size * 4);
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const o = (y * size + x) * 4;
    px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = c[3];
  };
  const rect = (x, y, w, h, c) => {
    for (let yy = Math.round(y); yy < Math.round(y + h); yy++)
      for (let xx = Math.round(x); xx < Math.round(x + w); xx++) set(xx, yy, c);
  };
  // fundo
  rect(0, 0, size, size, BG);
  // três linhas de tarefa
  const cb = size * 0.13;
  const barH = size * 0.10;
  const startY = size * 0.24;
  const gap = size * 0.21;
  const marginX = size * 0.2;
  for (let i = 0; i < 3; i++) {
    const y = startY + i * gap;
    rect(marginX, y, cb, cb, WHITE); // checkbox
    const barW = i === 2 ? size * 0.24 : size * 0.36;
    rect(marginX + cb + size * 0.06, y + (cb - barH) / 2, barW, barH, WHITE); // barra
  }

  // monta PNG (RGBA, 8 bits)
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtro none
    for (let x = 0; x < size * 4; x++) raw[y * (size * 4 + 1) + 1 + x] = px[y * size * 4 + x];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync(new URL("../public", import.meta.url), { recursive: true });
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), png(size));
  console.log("gerado public/" + name);
}
