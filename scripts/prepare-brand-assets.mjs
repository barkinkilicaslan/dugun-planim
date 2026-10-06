// Onaylanan "Kurdele" marka tasarımından çalışma zamanı marka varlıklarını üretir.
//
//   node scripts/prepare-brand-assets.mjs
//
// Kaynak: design-concepts/brand-ribbon-v1/icon-approved.png (onaylı, mercan zeminli krem kurdele).
// Kaynak yalnızca bu betik tarafından okunur; uygulama `design-concepts/` klasörüne bağlanmaz (EAS arşivine girmez).
// Çıktılar `assets/` altındadır. Betik bağımlılıksızdır (kendi küçük PNG okuyucu/yazıcısını kullanır) ve deterministiktir.
//
// Yöntem: Onaylı ikonun zemini ve kurdelesi iki düz renktir. Her pikselin kurdele payı (alfa), zemin→kurdele renk
// doğrusuna izdüşümle hesaplanır; gürültü eşiklenir, küçük yalıtılmış kalıntılar atılır. Böylece kurdele şekli
// değiştirilmeden, delikleri şeffaf ve kenarları pürüzsüz bir alfa maskesi elde edilir. Tüm çıktılar bu maskeden
// düz renklerle yeniden çizilir (JPEG/gürültü kalıntısı taşımaz).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { decodePng, encodePng } from './lib/png.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = resolve(ROOT, 'design-concepts/brand-ribbon-v1/icon-approved.png');
const IMAGES = resolve(ROOT, 'assets/images');
const BRAND = resolve(ROOT, 'assets/brand');

/** Onaylı ikondan ölçülen renkler (zemin ve kurdele medyanı). */
const CORAL = [233, 89, 108];
const IVORY = [252, 241, 228];
const WHITE = [255, 255, 255];

/** Android adaptive icon güvenli bölgesi: 108 dp tuvalin ortasında 66 dp çaplı daire. */
const SAFE_RADIUS = Math.floor((33 / 108) * 1024); // 312 px (1024 tuvalde)
/** Android 12 açılış simgesi güvenli dairesi: görsel genişliğinin 2/3'ü çapında. */
const SPLASH_RADIUS = Math.floor(1024 / 3) - 6; // 335 px

function write(directory, name, png) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, name), png);
}

/** Kurdele payı (0–1): zemin→kurdele renk doğrusuna izdüşüm, eşiklenmiş. */
function extractAlpha({ width, height, data }) {
  const d = IVORY.map((v, k) => v - CORAL[k]);
  const dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
  const alpha = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    let a = ((data[o] - CORAL[0]) * d[0] + (data[o + 1] - CORAL[1]) * d[1] + (data[o + 2] - CORAL[2]) * d[2]) / dd;
    a = a <= 0.04 ? 0 : a >= 0.96 ? 1 : a;
    alpha[i] = a;
  }
  return removeSpecks(alpha, width, height, 300);
}

/** Alanı `minArea` pikselden küçük, yalıtılmış kalıntıları temizler (4 komşuluk, alfa > 0). */
function removeSpecks(alpha, width, height, minArea) {
  const label = new Int32Array(width * height);
  const stack = [];
  let next = 0;
  for (let start = 0; start < alpha.length; start += 1) {
    if (alpha[start] === 0 || label[start]) continue;
    next += 1;
    const members = [];
    label[start] = next;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop();
      members.push(p);
      const x = p % width;
      const y = (p / width) | 0;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const q = ny * width + nx;
        if (alpha[q] !== 0 && !label[q]) {
          label[q] = next;
          stack.push(q);
        }
      }
    }
    if (members.length < minArea) for (const p of members) alpha[p] = 0;
  }
  return alpha;
}

/** Tam alan ortalamalı (kutu) yeniden örnekleme; yalnızca küçültme için. */
function resize(src, sw, sh, dw, dh) {
  const horizontal = new Float32Array(dw * sh);
  const xr = sw / dw;
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < dw; x += 1) {
      const a = x * xr;
      const b = (x + 1) * xr;
      let sum = 0;
      for (let i = Math.floor(a); i < Math.ceil(b) && i < sw; i += 1)
        sum += src[y * sw + i] * (Math.min(b, i + 1) - Math.max(a, i));
      horizontal[y * dw + x] = sum / xr;
    }
  }
  const out = new Float32Array(dw * dh);
  const yr = sh / dh;
  for (let x = 0; x < dw; x += 1) {
    for (let y = 0; y < dh; y += 1) {
      const a = y * yr;
      const b = (y + 1) * yr;
      let sum = 0;
      for (let j = Math.floor(a); j < Math.ceil(b) && j < sh; j += 1)
        sum += horizontal[j * dw + x] * (Math.min(b, j + 1) - Math.max(a, j));
      out[y * dw + x] = sum / yr;
    }
  }
  return out;
}

function bounds(alpha, width, height, threshold = 0.02) {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1)
      if (alpha[y * width + x] > threshold) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

function crop(alpha, width, box) {
  const w = box.x1 - box.x0;
  const h = box.y1 - box.y0;
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y += 1)
    for (let x = 0; x < w; x += 1) out[y * w + x] = alpha[(box.y0 + y) * width + box.x0 + x];
  return { alpha: out, width: w, height: h };
}

function canvas(width, height, color, alpha = 255) {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = color[0];
    data[i * 4 + 1] = color[1];
    data[i * 4 + 2] = color[2];
    data[i * 4 + 3] = alpha;
  }
  return { width, height, data };
}

/** `alpha` maskesini `color` rengiyle (over işleci) tuvale yazar. Şeffaf pikselde RGB her zaman `color` olur. */
function paint(target, alpha, aw, ah, ox, oy, color) {
  for (let y = 0; y < ah; y += 1) {
    for (let x = 0; x < aw; x += 1) {
      const a = alpha[y * aw + x];
      if (a <= 0) continue;
      const tx = ox + x;
      const ty = oy + y;
      if (tx < 0 || ty < 0 || tx >= target.width || ty >= target.height) continue;
      const o = (ty * target.width + tx) * 4;
      const ta = target.data[o + 3] / 255;
      const outA = a + ta * (1 - a);
      for (let k = 0; k < 3; k += 1)
        target.data[o + k] = Math.round((color[k] * a + target.data[o + k] * ta * (1 - a)) / outA);
      target.data[o + 3] = Math.round(outA * 255);
    }
  }
}

/** Kurdeleyi, tuval merkezinden en uzak (alfa > 0,05) noktası `radius` pikseli geçmeyecek biçimde yerleştirir. */
function fitInCircle(symbol, size, radius) {
  const cx = symbol.width / 2;
  const cy = symbol.height / 2;
  let far = 0;
  for (let y = 0; y < symbol.height; y += 1)
    for (let x = 0; x < symbol.width; x += 1)
      if (symbol.alpha[y * symbol.width + x] > 0.05) far = Math.max(far, Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
  const scale = radius / far;
  const w = Math.round(symbol.width * scale);
  const h = Math.round(symbol.height * scale);
  return {
    alpha: resize(symbol.alpha, symbol.width, symbol.height, w, h),
    width: w,
    height: h,
    ox: Math.round(size / 2 - w / 2),
    oy: Math.round(size / 2 - h / 2),
  };
}

/** Kurdeleyi genişliği `fraction × size` olacak biçimde tuval ortasına yerleştirir. */
function fitWidth(symbol, size, fraction, maxHeightFraction = 0.9) {
  let w = Math.round(size * fraction);
  let h = Math.round((symbol.height * w) / symbol.width);
  if (h > size * maxHeightFraction) {
    h = Math.round(size * maxHeightFraction);
    w = Math.round((symbol.width * h) / symbol.height);
  }
  return {
    alpha: resize(symbol.alpha, symbol.width, symbol.height, w, h),
    width: w,
    height: h,
    ox: Math.round((size - w) / 2),
    oy: Math.round((size - h) / 2),
  };
}

function main() {
  const source = decodePng(readFileSync(SOURCE));
  if (source.width !== 1254 || source.height !== 1254) throw new Error('Beklenmeyen kaynak boyutu');
  const alpha = extractAlpha(source);
  const box = bounds(alpha, source.width, source.height);
  const symbol = crop(alpha, source.width, box);

  // 1) iOS ikonu: onaylı kompozisyonun birebir yeniden çizimi (1024×1024, opak, köşeler önceden yuvarlatılmamış).
  const iconAlpha = resize(alpha, source.width, source.height, 1024, 1024);
  const icon = canvas(1024, 1024, CORAL);
  paint(icon, iconAlpha, 1024, 1024, 0, 0, IVORY);
  write(IMAGES, 'icon.png', encodePng(icon, { opaque: true }));

  // 2) Android adaptive icon: ön plan, arka plan, tek renkli sürüm (güvenli daire içinde).
  const safe = fitInCircle(symbol, 1024, SAFE_RADIUS);
  const foreground = canvas(1024, 1024, IVORY, 0);
  paint(foreground, safe.alpha, safe.width, safe.height, safe.ox, safe.oy, IVORY);
  write(IMAGES, 'android-icon-foreground.png', encodePng(foreground));
  write(IMAGES, 'android-icon-background.png', encodePng(canvas(1024, 1024, CORAL), { opaque: true }));
  const monochrome = canvas(1024, 1024, WHITE, 0);
  paint(monochrome, safe.alpha, safe.width, safe.height, safe.ox, safe.oy, WHITE);
  write(IMAGES, 'android-icon-monochrome.png', encodePng(monochrome));

  // 3) Açılış ekranı: şeffaf zeminde krem kurdele (zemin rengi app.config.ts içindeki mercan).
  const splashFit = fitInCircle(symbol, 1024, SPLASH_RADIUS);
  const splash = canvas(1024, 1024, IVORY, 0);
  paint(splash, splashFit.alpha, splashFit.width, splashFit.height, splashFit.ox, splashFit.oy, IVORY);
  write(IMAGES, 'splash-icon.png', encodePng(splash));

  // 4) Favicon (64×64, opak mercan zemin) ve bildirim ikonu (96×96, yalnız beyaz + şeffaflık).
  const favFit = fitWidth(symbol, 64, 0.8);
  const favicon = canvas(64, 64, CORAL);
  paint(favicon, favFit.alpha, favFit.width, favFit.height, favFit.ox, favFit.oy, IVORY);
  write(IMAGES, 'favicon.png', encodePng(favicon, { opaque: true }));
  const noteFit = fitWidth(symbol, 96, 0.88);
  const notification = canvas(96, 96, WHITE, 0);
  paint(notification, noteFit.alpha, noteFit.width, noteFit.height, noteFit.ox, noteFit.oy, WHITE);
  write(IMAGES, 'notification-icon.png', encodePng(notification));

  // 5) Şeffaf sembol ana dosyaları (sıkı kırpılmış): krem ve mercan sürümleri.
  for (const [name, color] of [
    ['ribbon-symbol-ivory.png', IVORY],
    ['ribbon-symbol-coral.png', CORAL],
  ]) {
    const master = canvas(symbol.width, symbol.height, color, 0);
    paint(master, symbol.alpha, symbol.width, symbol.height, 0, 0, color);
    write(BRAND, name, encodePng(master));
  }

  console.log(`Kurdele sembolü: ${symbol.width}×${symbol.height}px, güvenli bölge yarıçapı ${SAFE_RADIUS}px.`);
  console.log('Simge, adaptive icon, açılış ekranı, favicon ve bildirim ikonu üretildi.');

  // 6) Yazılı logolar: Windows'ta GDI+ ile "Düğün Planım" gerçek yazı tipiyle dizilir (Türkçe karakterler doğru).
  if (process.platform === 'win32') {
    const result = spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        resolve(import.meta.dirname, 'render-brand-logos.ps1'),
        '-Root',
        ROOT,
      ],
      { encoding: 'utf8' },
    );
    if (result.status !== 0) throw new Error(`Logo üretimi başarısız: ${result.stderr || result.stdout}`);
    console.log(result.stdout.trim());
  } else {
    console.log('Yazılı logolar yalnız Windows (GDI+) üzerinde yeniden üretilir; mevcut dosyalar korundu.');
  }
}

main();
