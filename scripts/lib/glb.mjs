/*
 * Minimal GLB read/write helpers shared by the character-asset scripts.
 *
 * Deliberately dependency-free: it parses the two GLB chunks, pulls accessors
 * into typed arrays, and rebuilds the binary buffer from scratch with one
 * tightly packed bufferView per accessor. Nothing downstream has to care how
 * the source exporter happened to lay its data out.
 */
import fs from 'node:fs';
import path from 'node:path';

export const MAGIC = 0x46546c67;
export const JSON_CHUNK = 0x4e4f534a;
export const BIN_CHUNK = 0x004e4942;

export const COMP = {
  5120: { array: Int8Array, size: 1 },
  5121: { array: Uint8Array, size: 1 },
  5122: { array: Int16Array, size: 2 },
  5123: { array: Uint16Array, size: 2 },
  5125: { array: Uint32Array, size: 4 },
  5126: { array: Float32Array, size: 4 },
};

export const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

export function readGlb(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== MAGIC) throw new Error(`${file} is not a GLB`);
  let off = 12;
  let json = null;
  let bin = Buffer.alloc(0);
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.readUInt32LE(off + 4);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === JSON_CHUNK) json = JSON.parse(data.toString('utf8'));
    else if (type === BIN_CHUNK) bin = data;
    off += 8 + len + ((4 - (len % 4)) % 4);
  }
  if (!json) throw new Error(`${file} has no JSON chunk`);
  return { json, bin };
}

export function writeGlb(file, json, bin) {
  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
  const binPad = (4 - (bin.length % 4)) % 4;
  const total = 12 + 8 + jsonBuf.length + jsonPad + (bin.length ? 8 + bin.length + binPad : 0);

  const out = Buffer.alloc(total);
  out.writeUInt32LE(MAGIC, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(total, 8);

  let p = 12;
  out.writeUInt32LE(jsonBuf.length + jsonPad, p);
  out.writeUInt32LE(JSON_CHUNK, p + 4);
  jsonBuf.copy(out, p + 8);
  out.fill(0x20, p + 8 + jsonBuf.length, p + 8 + jsonBuf.length + jsonPad);
  p += 8 + jsonBuf.length + jsonPad;

  if (bin.length) {
    out.writeUInt32LE(bin.length + binPad, p);
    out.writeUInt32LE(BIN_CHUNK, p + 4);
    bin.copy(out, p + 8);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  return total;
}

/** Accessor → plain typed array, de-interleaving if the source used a stride. */
export function readAccessor(json, bin, index) {
  const acc = json.accessors[index];
  if (acc.sparse) throw new Error('sparse accessors are not supported');
  const { array: Arr, size } = COMP[acc.componentType];
  const n = NUM[acc.type];
  const out = new Arr(acc.count * n);
  if (acc.bufferView == null) return out; // spec: absent bufferView means zeroes

  const view = json.bufferViews[acc.bufferView];
  const base = (view.byteOffset || 0) + (acc.byteOffset || 0);
  const stride = view.byteStride || n * size;
  for (let i = 0; i < acc.count; i++) {
    const at = base + i * stride;
    for (let c = 0; c < n; c++) {
      const o = at + c * size;
      switch (acc.componentType) {
        case 5120: out[i * n + c] = bin.readInt8(o); break;
        case 5121: out[i * n + c] = bin.readUInt8(o); break;
        case 5122: out[i * n + c] = bin.readInt16LE(o); break;
        case 5123: out[i * n + c] = bin.readUInt16LE(o); break;
        case 5125: out[i * n + c] = bin.readUInt32LE(o); break;
        default: out[i * n + c] = bin.readFloatLE(o); break;
      }
    }
  }
  return out;
}

/** Accumulates 4-byte aligned bufferViews into one binary blob. */
export class BufferBuilder {
  constructor() {
    this.chunks = [];
    this.views = [];
    this.cursor = 0;
  }

  push(buf, extra = {}) {
    const pad = (4 - (this.cursor % 4)) % 4;
    if (pad) { this.chunks.push(Buffer.alloc(pad)); this.cursor += pad; }
    this.views.push({ buffer: 0, byteOffset: this.cursor, byteLength: buf.length, ...extra });
    this.chunks.push(buf);
    this.cursor += buf.length;
    return this.views.length - 1;
  }

  /** Append a typed array as a new accessor, returning its accessor index. */
  pushAccessor(json, array, type, componentType, extra = {}) {
    const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    const bufferView = this.push(bytes, extra.target ? { target: extra.target } : {});
    json.accessors.push({
      bufferView,
      componentType,
      count: array.length / NUM[type],
      type,
      ...(extra.min ? { min: extra.min, max: extra.max } : {}),
    });
    return json.accessors.length - 1;
  }

  finish() {
    return Buffer.concat(this.chunks);
  }
}

export const mb = (n) => (n / 1048576).toFixed(1);
