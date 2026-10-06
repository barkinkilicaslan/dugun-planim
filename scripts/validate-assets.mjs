import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { decodePng } from './lib/png.mjs';

const root = resolve(import.meta.dirname, '..');

async function pngInfo(relativePath) {
  const file = await readFile(resolve(root, relativePath));
  const signature = '89504e470d0a1a0a';
  if (file.subarray(0, 8).toString('hex') !== signature) throw new Error(`${relativePath}: PNG değil`);
  return {
    width: file.readUInt32BE(16),
    height: file.readUInt32BE(20),
    hasAlpha: [4, 6].includes(file[25]),
  };
}

async function expectPng(relativePath, width, height, alpha) {
  const actual = await pngInfo(relativePath);
  if (actual.width !== width || actual.height !== height || actual.hasAlpha !== alpha) {
    throw new Error(`${relativePath}: beklenen ${width}x${height} alpha=${alpha}, bulunan ${JSON.stringify(actual)}`);
  }
}

await expectPng('assets/images/icon.png', 1024, 1024, false);
await expectPng('assets/images/android-icon-foreground.png', 1024, 1024, true);
await expectPng('assets/images/android-icon-background.png', 1024, 1024, false);
await expectPng('assets/images/android-icon-monochrome.png', 1024, 1024, true);
await expectPng('assets/images/splash-icon.png', 1024, 1024, true);
await expectPng('assets/images/favicon.png', 64, 64, false);
await expectPng('assets/images/notification-icon.png', 96, 96, true);
await expectPng('assets/brand/logo-horizontal.png', 1800, 600, false);
await expectPng('assets/brand/logo-primary.png', 1200, 1200, false);
await expectPng('assets/store/google-play-icon.png', 512, 512, true);
await expectPng('assets/store/feature-graphic.png', 1024, 500, false);

// --- Marka (Kurdele) piksel denetimleri ---------------------------------------------------------------------------
const CORAL = [233, 89, 108];
const IVORY = [252, 241, 228];
const readPixels = async (relativePath) => decodePng(await readFile(resolve(root, relativePath)));
const near = (a, b, tolerance = 2) => a.every((value, index) => Math.abs(value - b[index]) <= tolerance);
const pixelAt = ({ width, data }, x, y) => [
  data[(y * width + x) * 4],
  data[(y * width + x) * 4 + 1],
  data[(y * width + x) * 4 + 2],
];
const farthestOpaque = ({ width, height, data }) => {
  let far = 0;
  let count = 0;
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1)
      if (data[(y * width + x) * 4 + 3] > 12) {
        count += 1;
        far = Math.max(far, Math.hypot(x + 0.5 - width / 2, y + 0.5 - height / 2));
      }
  return { far, count };
};
function check(condition, message) {
  if (!condition) throw new Error(message);
}

// iOS ikonu: köşeler dahil tüm kenar boyunca düz mercan (önceden yuvarlatılmamış), ortada krem kurdele.
const icon = await readPixels('assets/images/icon.png');
for (const [x, y] of [
  [0, 0],
  [1023, 0],
  [0, 1023],
  [1023, 1023],
  [512, 0],
  [0, 512],
  [1023, 512],
  [512, 1023],
  [6, 6],
  [1017, 1017],
])
  check(near(pixelAt(icon, x, y), CORAL), `icon.png: (${x},${y}) mercan değil; köşeler önceden yuvarlatılmış olabilir`);
let ivoryPixels = 0;
for (let i = 0; i < 1024 * 1024; i += 1)
  if (near([icon.data[i * 4], icon.data[i * 4 + 1], icon.data[i * 4 + 2]], IVORY, 3)) ivoryPixels += 1;
check(
  ivoryPixels > 0.1 * 1024 * 1024 && ivoryPixels < 0.25 * 1024 * 1024,
  `icon.png: kurdele alanı beklenmeyen (${ivoryPixels})`,
);

// Android adaptive icon: ön plan güvenli daire (108 dp tuvalde 66 dp çap) içinde; tek renkli yalnız beyaz.
const foreground = await readPixels('assets/images/android-icon-foreground.png');
const fg = farthestOpaque(foreground);
check(
  fg.count > 100000 && fg.far <= 313,
  `android-icon-foreground.png: güvenli alan dışına taşıyor (${fg.far.toFixed(1)} px)`,
);
const monochrome = await readPixels('assets/images/android-icon-monochrome.png');
const mono = farthestOpaque(monochrome);
check(mono.far <= 313, 'android-icon-monochrome.png: güvenli alan dışına taşıyor');
for (let i = 0; i < 1024 * 1024; i += 1)
  if (monochrome.data[i * 4 + 3] > 0)
    check(
      monochrome.data[i * 4] === 255 && monochrome.data[i * 4 + 1] === 255 && monochrome.data[i * 4 + 2] === 255,
      'android-icon-monochrome.png: beyaz olmayan piksel',
    );
const background = await readPixels('assets/images/android-icon-background.png');
check(
  near(pixelAt(background, 0, 0), CORAL) && near(pixelAt(background, 1023, 1023), CORAL),
  'android-icon-background.png: mercan değil',
);

// Açılış ekranı: Android 12 açılış simgesi güvenli dairesi (görsel genişliğinin 2/3'ü çap).
const splash = await readPixels('assets/images/splash-icon.png');
check(farthestOpaque(splash).far <= 1024 / 3, 'splash-icon.png: Android 12 güvenli dairesini aşıyor');

// Bildirim ikonu: yalnız beyaz + şeffaflık.
const notification = await readPixels('assets/images/notification-icon.png');
let notificationOpaque = 0;
for (let i = 0; i < 96 * 96; i += 1)
  if (notification.data[i * 4 + 3] > 0) {
    notificationOpaque += 1;
    check(
      notification.data[i * 4] === 255 && notification.data[i * 4 + 1] === 255 && notification.data[i * 4 + 2] === 255,
      'notification-icon.png: beyaz olmayan piksel',
    );
  }
check(notificationOpaque > 1000 && notificationOpaque < 96 * 96 * 0.6, 'notification-icon.png: beklenmeyen kapsama');

// Şeffaf sembol ana dosyaları: yalnız ana düğüm ve iki kuyruk (3 bileşen), yalıtılmış kalıntı yok; delikler şeffaf.
for (const name of ['ribbon-symbol-ivory.png', 'ribbon-symbol-coral.png']) {
  const { width, height, data } = await readPixels(`assets/brand/${name}`);
  const label = new Int32Array(width * height);
  const sizes = [];
  for (let start = 0; start < width * height; start += 1) {
    if (data[start * 4 + 3] === 0 || label[start]) continue;
    const id = sizes.length + 1;
    const stack = [start];
    label[start] = id;
    let area = 0;
    while (stack.length) {
      const position = stack.pop();
      area += 1;
      const x = position % width;
      const y = (position / width) | 0;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (data[next * 4 + 3] !== 0 && !label[next]) {
          label[next] = id;
          stack.push(next);
        }
      }
    }
    sizes.push(area);
  }
  check(
    sizes.length === 3 && sizes.every((area) => area > 20000),
    `${name}: yalıtılmış kalıntı var (bileşenler: ${sizes.join(', ')})`,
  );
  // Sol döngünün deliği şeffaf olmalı (kaynakta zemin rengi değil).
  const hole = (Math.round(height * 0.34) * width + Math.round(width * 0.22)) * 4;
  check(data[hole + 3] === 0, `${name}: döngü içi şeffaf değil`);
}

const screenshotDirectory = resolve(root, 'store-listing', 'screenshots');
const screenshotFiles = (await readdir(screenshotDirectory)).filter(
  (name) => name.endsWith('.png') && !name.endsWith('-source.png'),
);
const phone = screenshotFiles.filter((name) => name.startsWith('phone-'));
const tablet = screenshotFiles.filter((name) => name.startsWith('tablet-'));
if (phone.length !== 4 || tablet.length !== 4) {
  throw new Error(`Ekran görüntüsü seti eksik: phone=${phone.length}, tablet=${tablet.length}`);
}
for (const name of phone) await expectPng(`store-listing/screenshots/${name}`, 1290, 2796, false);
for (const name of tablet) await expectPng(`store-listing/screenshots/${name}`, 2048, 2732, false);

// App Store: dile ve cihaza göre 6'şar ekran görüntüsü (1-10 arası kabul edilir).
const localizedSets = [
  ['tr', 'iPhone', 1290, 2796],
  ['tr', 'iPad', 2048, 2732],
  ['en-US', 'iPhone', 1290, 2796],
  ['en-US', 'iPad', 2048, 2732],
];
for (const [language, device, width, height] of localizedSets) {
  const relative = `store-listing/screenshots/${language}/${device}`;
  const names = (await readdir(resolve(root, relative))).filter((name) => name.endsWith('.png')).sort();
  if (names.length !== 6) throw new Error(`${relative}: 6 ekran görüntüsü bekleniyordu, ${names.length} bulundu`);
  for (const name of names) await expectPng(`${relative}/${name}`, width, height, false);
}

console.log(
  'Release assets PASS: brand icons (pixel checks), feature graphic, legacy 4+4 screenshots, and 6 screenshots for each TR/EN iPhone/iPad set.',
);
