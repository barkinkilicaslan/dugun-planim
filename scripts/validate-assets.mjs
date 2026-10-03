import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

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
await expectPng('assets/store/google-play-icon.png', 512, 512, true);
await expectPng('assets/store/feature-graphic.png', 1024, 500, false);

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
  'Release assets PASS: icons, feature graphic, legacy 4+4 screenshots, and 6 screenshots for each TR/EN iPhone/iPad set.',
);
