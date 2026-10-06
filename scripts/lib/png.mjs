// Bağımlılıksız, küçük bir PNG okuyucu/yazıcı (yalnız 8 bit, aralanmamış RGB/RGBA/gri/gri+alfa).
// Marka varlığı üretim betiği tarafından kullanılır; uygulama paketine girmez.
import { deflateSync, inflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** PNG → { width, height, data } (data: RGBA, 4 bayt/piksel). */
export function decodePng(file) {
  if (!file.subarray(0, 8).equals(SIGNATURE)) throw new Error('PNG değil');
  let offset = 8;
  let header;
  const parts = [];
  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString('ascii', offset + 4, offset + 8);
    const body = file.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') header = body;
    if (type === 'IDAT') parts.push(body);
    offset += 12 + length;
  }
  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const depth = header[8];
  const colorType = header[9];
  if (depth !== 8 || header[12] !== 0) throw new Error('Yalnız 8 bit ve aralanmamış PNG desteklenir');
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`Desteklenmeyen renk türü ${colorType}`);
  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 4);
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? line[x - channels] : 0;
      const up = previous[x];
      const upLeft = x >= channels ? previous[x - channels] : 0;
      let add = 0;
      if (filter === 1) add = left;
      else if (filter === 2) add = up;
      else if (filter === 3) add = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        add = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      line[x] = (line[x] + add) & 0xff;
    }
    for (let x = 0; x < width; x += 1) {
      const i = x * channels;
      const o = (y * width + x) * 4;
      if (channels === 1 || channels === 2) {
        out[o] = out[o + 1] = out[o + 2] = line[i];
        out[o + 3] = channels === 2 ? line[i + 1] : 255;
      } else {
        out[o] = line[i];
        out[o + 1] = line[i + 1];
        out[o + 2] = line[i + 2];
        out[o + 3] = channels === 4 ? line[i + 3] : 255;
      }
    }
    previous = line;
  }
  return { width, height, data: out };
}

/** { width, height, data: RGBA } → PNG. `opaque` true ise alfa kanalı yazılmaz (RGB, 24 bit). */
export function encodePng({ width, height, data }, { opaque = false } = {}) {
  const channels = opaque ? 3 : 4;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < width; x += 1) {
      const s = (y * width + x) * 4;
      const o = y * (stride + 1) + 1 + x * channels;
      raw[o] = data[s];
      raw[o + 1] = data[s + 1];
      raw[o + 2] = data[s + 2];
      if (!opaque) raw[o + 3] = data[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = opaque ? 2 : 6;
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
