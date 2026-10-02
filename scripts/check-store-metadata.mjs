// App Store Connect metin alanlarını Apple sınırlarına karşı doğrular.
// Kullanım: node scripts/check-store-metadata.mjs [--write]   (--write: dosyalardaki sayı tablosunu günceller)
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const write = process.argv.includes('--write');
const BASE = 'https://barkinkilicaslan.github.io/dugun-planim';

const locales = [
  {
    file: 'store-listing/app-store-tr.md',
    labels: {
      name: 'Uygulama adı',
      subtitle: 'Alt başlık',
      promo: 'Promosyon metni',
      keywords: 'Anahtar kelimeler',
      support: "Destek URL'si",
      privacy: "Gizlilik politikası URL'si",
      marketing: "Pazarlama URL'si",
      publisher: 'Yayıncı',
      copyright: 'Telif hakkı',
      contactName: 'Ad soyad',
      contactPhone: 'Telefon',
      contactEmail: 'E-posta',
    },
    blocks: { description: '## Açıklama', whatsNew: '## Sürüm bilgisi', review: '## App Review notu' },
    urls: { support: `${BASE}/support/`, privacy: `${BASE}/privacy/`, marketing: `${BASE}/` },
  },
  {
    file: 'store-listing/app-store-en-US.md',
    labels: {
      name: 'App name',
      subtitle: 'Subtitle',
      promo: 'Promotional text',
      keywords: 'Keywords',
      support: 'Support URL',
      privacy: 'Privacy Policy URL',
      marketing: 'Marketing URL',
      publisher: 'Publisher',
      copyright: 'Copyright',
      contactName: 'Name',
      contactPhone: 'Phone',
      contactEmail: 'E-mail',
    },
    blocks: { description: '## Description', whatsNew: '## Version information', review: '## App Review notes' },
    urls: { support: `${BASE}/en/support/`, privacy: `${BASE}/en/privacy/`, marketing: `${BASE}/en/` },
  },
];

const limits = {
  name: { chars: 30 },
  subtitle: { chars: 30 },
  promo: { chars: 170 },
  description: { chars: 4000 },
  keywords: { bytes: 100 },
  whatsNew: { chars: 4000 },
  review: { bytes: 4000 },
};

const chars = (text) => [...text].length;
const bytes = (text) => Buffer.byteLength(text, 'utf8');
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function line(markdown, label) {
  const match = markdown.match(new RegExp(`^- ${escapeRegExp(label)}: \`([^\`]*)\`\\s*$`, 'm'));
  return match ? match[1] : undefined;
}

function block(markdown, heading) {
  const start = markdown.indexOf(`\n${heading}\n`);
  if (start < 0) return undefined;
  const rest = markdown.slice(start + heading.length + 2);
  const next = rest.search(/\n## /);
  const section = next < 0 ? rest : rest.slice(0, next);
  const match = section.match(/```text\n([\s\S]*?)\n```/);
  return match ? match[1] : undefined;
}

const words = (text) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

for (const locale of locales) {
  const path = resolve(root, locale.file);
  let markdown = await readFile(path, 'utf8');
  const fields = {};
  for (const key of ['name', 'subtitle', 'promo', 'keywords', 'support', 'privacy', 'marketing', 'publisher', 'copyright']) {
    fields[key] = line(markdown, locale.labels[key]);
  }
  for (const [key, heading] of Object.entries(locale.blocks)) fields[key] = block(markdown, heading);
  const contact = {
    name: line(markdown, locale.labels.contactName),
    phone: line(markdown, locale.labels.contactPhone),
    email: line(markdown, locale.labels.contactEmail),
  };

  const rows = [];
  for (const [key, limit] of Object.entries(limits)) {
    const value = fields[key];
    if (value === undefined || !value.trim()) {
      fail(locale.file, `${key} alanı bulunamadı veya boş`);
      continue;
    }
    const c = chars(value);
    const b = bytes(value);
    rows.push({ key, chars: c, bytes: b, limit: limit.chars ? `${limit.chars} karakter` : `${limit.bytes} bayt` });
    if (limit.chars && c > limit.chars) fail(locale.file, `${key}: ${c} karakter > ${limit.chars}`);
    if (limit.bytes && b > limit.bytes) fail(locale.file, `${key}: ${b} bayt > ${limit.bytes}`);
  }

  // Anahtar kelimeler: tekrar yok, boşluk yok, ad/alt başlıkta geçen kelime yok.
  if (fields.keywords) {
    const list = fields.keywords.split(',');
    if (fields.keywords.includes(' ')) fail(locale.file, 'anahtar kelimelerde boşluk var (virgülden sonra boşluk bayt harcar)');
    if (list.some((word) => !word)) fail(locale.file, 'anahtar kelimelerde boş öğe var');
    const seen = new Set();
    for (const word of list.map((entry) => entry.toLowerCase())) {
      if (seen.has(word)) fail(locale.file, `anahtar kelime tekrarı: ${word}`);
      seen.add(word);
    }
    const reserved = new Set([...words(fields.name ?? ''), ...words(fields.subtitle ?? '')]);
    for (const word of seen) if (reserved.has(word)) fail(locale.file, `anahtar kelime ad/alt başlıkta zaten var: ${word}`);
  }

  // Yasaklı iddialar ve yer tutucular.
  const everything = Object.values(fields).filter(Boolean).join('\n');
  if (/example\.com|destek@/i.test(everything)) fail(locale.file, 'örnek/placeholder e-posta bulundu');
  if (/\{\{(?!APP_REVIEW_PHONE\}\})[^}]+\}\}/.test(markdown)) fail(locale.file, 'beklenmeyen {{yer tutucu}} var');
  if (contact.phone !== '{{APP_REVIEW_PHONE}}') fail(locale.file, 'inceleme telefonu tam olarak {{APP_REVIEW_PHONE}} olmalı');
  if (contact.email !== 'appsupportline@gmail.com') fail(locale.file, 'inceleme e-postası appsupportline@gmail.com olmalı');
  if (contact.name !== 'Barkın Kılıçaslan') fail(locale.file, 'inceleme iletişim adı Barkın Kılıçaslan olmalı');
  if (fields.publisher !== 'Barkın Kılıçaslan') fail(locale.file, 'yayıncı adı hatalı');
  if (fields.copyright !== '2026 Barkın Kılıçaslan') fail(locale.file, 'telif hakkı hatalı');
  if (fields.name !== 'Düğün Planım') fail(locale.file, 'uygulama adı Düğün Planım olmalı');
  for (const key of ['support', 'privacy', 'marketing']) {
    if (fields[key] !== locale.urls[key]) fail(locale.file, `${key} URL beklenen değil: ${fields[key]}`);
  }
  if (line(markdown, locale.file.includes('-tr') ? 'Birincil kategori' : 'Primary category') !== 'Lifestyle') {
    fail(locale.file, 'birincil kategori Lifestyle olmalı');
  }
  if (line(markdown, locale.file.includes('-tr') ? 'İkincil kategori' : 'Secondary category') !== 'Productivity') {
    fail(locale.file, 'ikincil kategori Productivity olmalı');
  }
  const sensitive = /(online|çevrimiçi) RSVP (hizmeti )?(sunar|var)\b|otomatik yanıt toplar|automatically collects replies/i;
  if (sensitive.test(everything)) fail(locale.file, 'çevrimiçi RSVP iddiası var');
  if (/\b(subscription|abonelik|in-app|uygulama içi satın)\b/i.test(fields.description ?? '')) {
    fail(locale.file, 'açıklamada abonelik/IAP ifadesi var');
  }

  const table = [
    '| Alan | Karakter | Bayt | Sınır |',
    '| --- | ---: | ---: | --- |',
    ...rows.map((row) => `| ${row.key} | ${row.chars} | ${row.bytes} | ${row.limit} |`),
  ].join('\n');
  console.log(`\n${locale.file}\n${table}`);
  if (write) {
    markdown = markdown.replace(
      /<!-- METADATA-COUNTS:START -->[\s\S]*<!-- METADATA-COUNTS:END -->/,
      `<!-- METADATA-COUNTS:START -->\n${table}\n<!-- METADATA-COUNTS:END -->`,
    );
    await writeFile(path, markdown);
  }
}

if (failures.length) {
  console.error(`\nMetadata FAIL:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('\nMetadata PASS: TR ve EN alanları Apple sınırları içinde.');
