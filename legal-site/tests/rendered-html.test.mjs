import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const clientDir = new URL('../dist/client/', import.meta.url);
const clientRoot = fileURLToPath(clientDir);
/** Üretim derlemesi `NEXT_PUBLIC_SITE_BASE_PATH` ile alındıysa dahili bağlantılar bu önekle başlar (ör. /dugun-planim). */
const basePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '';
const SITE = 'https://barkinkilicaslan.github.io/dugun-planim';

async function render(pathname) {
  const workerUrl = new URL('../dist/server/index.js', import.meta.url);
  workerUrl.searchParams.set('test', `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: 'text/html' } }),
    { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function html(pathname) {
  const response = await render(pathname);
  assert.equal(response.status, 200, `${pathname} should respond with 200`);
  return response.text();
}

const trRoutes = [
  { path: '/', file: 'index.html', title: 'Düğün Planım · Gizlilik ve Destek', h1: /Planınız sizin/, page: 'home' },
  {
    path: '/privacy/',
    file: 'privacy/index.html',
    title: 'Gizlilik Politikası',
    h1: /Gizlilik Politikası/,
    page: 'privacy',
  },
  { path: '/terms/', file: 'terms/index.html', title: 'Kullanım Koşulları', h1: /Kullanım Koşulları/, page: 'terms' },
  {
    path: '/data-retention/',
    file: 'data-retention/index.html',
    title: 'Veri Saklama ve Silme',
    h1: /Veri Saklama ve Silme/,
    page: 'data-retention',
  },
  {
    path: '/support/',
    file: 'support/index.html',
    title: 'Destek ve SSS',
    h1: /Destek ve Sık Sorulan Sorular/,
    page: 'support',
  },
];

const enRoutes = [
  {
    path: '/en/',
    file: 'en/index.html',
    title: 'Düğün Planım · Privacy and Support',
    h1: /Your plan is yours/,
    page: 'home',
  },
  {
    path: '/en/privacy/',
    file: 'en/privacy/index.html',
    title: 'Privacy Policy',
    h1: /Privacy Policy/,
    page: 'privacy',
  },
  { path: '/en/terms/', file: 'en/terms/index.html', title: 'Terms of Use', h1: /Terms of Use/, page: 'terms' },
  {
    path: '/en/data-retention/',
    file: 'en/data-retention/index.html',
    title: 'Data Retention and Deletion',
    h1: /Data Retention and Deletion/,
    page: 'data-retention',
  },
  {
    path: '/en/support/',
    file: 'en/support/index.html',
    title: 'Support and FAQ',
    h1: /Support and Frequently Asked Questions/,
    page: 'support',
  },
];

const pathFor = (locale, page) => {
  const segment = page === 'home' ? '' : `/${page}`;
  return locale === 'en' ? `/en${segment}` : segment || '/';
};

test('server-renders the branded and accessible Turkish home page', async () => {
  const response = await render('/');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/i);
  const page = await response.text();
  assert.match(page, /Düğün Planım/);
  assert.match(page, /Planınız sizin/);
  assert.match(page, new RegExp(`href="${basePath}/privacy"`));
  assert.match(page, /class="skip-link"/);
  assert.doesNotMatch(page, /codex-preview|react-loading-skeleton|Starter Project/i);
});

for (const route of trRoutes) {
  test(`renders the Turkish page ${route.path}`, async () => {
    const page = await html(route.path);
    assert.match(page, route.h1);
    assert.match(page, /<div lang="tr">/);
    assert.doesNotMatch(page, /<div lang="en">/);
    assert.match(page, new RegExp(`<title>${route.title}(?: · Düğün Planım)?</title>`));
  });
}

for (const route of enRoutes) {
  test(`renders the English page ${route.path}`, async () => {
    const page = await html(route.path);
    assert.match(page, route.h1);
    assert.match(page, /<div lang="en">/);
    assert.doesNotMatch(page, /<div lang="tr">/);
    assert.match(page, /Skip to content/);
    assert.match(page, new RegExp(`<title>${route.title}(?: · Düğün Planım)?</title>`));
    assert.doesNotMatch(page, /İçeriğe geç|Hesap yok|Gizlilik Politikası|Son güncelleme/);
  });
}

for (const [routes, locale, label, hreflang, otherLocale] of [
  [trRoutes, 'tr', 'English', 'en', 'en'],
  [enRoutes, 'en', 'Türkçe', 'tr', 'tr'],
]) {
  for (const route of routes) {
    test(`${locale} ${route.path} links to the other language`, async () => {
      const page = await html(route.path);
      const target = `${basePath}${pathFor(otherLocale, route.page)}`;
      const anchor = new RegExp(`<a[^>]*class="lang-switch"[^>]*href="${target}"[^>]*>${label}</a>`, 'g');
      const matches = page.match(anchor) ?? [];
      assert.equal(matches.length, 2, 'language link appears in the header and the footer');
      for (const match of matches) {
        assert.match(match, new RegExp(`lang="${hreflang}"`));
        assert.match(match, new RegExp(`hrefLang="${hreflang}"`, 'i'));
      }
    });
  }
}

test('canonical and alternate language links are absolute GitHub Pages addresses', async () => {
  for (const page of ['home', 'privacy', 'terms', 'data-retention', 'support']) {
    for (const locale of ['tr', 'en']) {
      const route = (locale === 'tr' ? trRoutes : enRoutes).find((candidate) => candidate.page === page);
      const markup = await html(route.path);
      const url = (l) => `${SITE}${pathFor(l, page) === '/' ? '/' : `${pathFor(l, page)}/`}`;
      assert.ok(markup.includes(`<link rel="canonical" href="${url(locale)}"`), `${locale} ${page} canonical`);
      assert.ok(markup.includes(`hrefLang="tr" href="${url('tr')}"`), `${locale} ${page} tr alternate`);
      assert.ok(markup.includes(`hrefLang="en" href="${url('en')}"`), `${locale} ${page} en alternate`);
      assert.ok(markup.includes(`hrefLang="x-default" href="${url('tr')}"`), `${locale} ${page} x-default`);
    }
  }
});

test('English pages carry English metadata descriptions', async () => {
  const privacy = await html('/en/privacy/');
  assert.match(
    privacy,
    /<meta name="description" content="Düğün Planım privacy policy: your data stays on your device/,
  );
  assert.match(privacy, /property="og:locale" content="en_US"/);
  const home = await html('/en/');
  assert.match(
    home,
    /<meta name="description" content="Düğün Planım privacy policy, terms of use and support center\."/,
  );
  const turkish = await html('/privacy/');
  assert.match(turkish, /<meta name="description" content="Düğün Planım gizlilik politikası/);
  assert.match(turkish, /property="og:locale" content="tr_TR"/);
});

test('both languages show the support email and publisher name', async () => {
  for (const route of [...trRoutes, ...enRoutes]) {
    const page = await html(route.path);
    assert.match(page, /appsupportline@gmail\.com/, `${route.path} shows the support email`);
    assert.match(page, /Barkın Kılıçaslan/, `${route.path} shows the publisher name`);
    assert.doesNotMatch(page, /example\.com/, `${route.path} has no placeholder address`);
  }
  assert.match(await html('/support/'), /href="mailto:appsupportline@gmail\.com"/);
  assert.match(await html('/en/support/'), /href="mailto:appsupportline@gmail\.com"/);
});

test('the English privacy policy states the real data practices', async () => {
  const page = (await html('/en/privacy/')).replace(/&#x27;|&#39;/g, "'");
  assert.match(page, /does not operate a user\s+account or a data server/);
  assert.match(page, /Contacts permission is requested only when you tap/);
  assert.match(page, /only the name, phone number and email of the contacts you select/);
  assert.match(page, /never sends a message without your\s+confirmation/);
  assert.match(page, /There is no online RSVP service/);
  assert.match(page, /stored only locally on your device/);
  assert.doesNotMatch(page, /We collect|we share|third parties may receive/i);
});

test('the English data and support pages state the backup and language facts', async () => {
  const data = await html('/en/data-retention/');
  assert.match(data, /photos you added to invitations are not included in the\s+backup file/);
  assert.match(data, /no automatic\s+server copy or cloud sync/);
  const support = await html('/en/support/');
  assert.match(support, /Invitation photos are not included in the backup/);
  assert.match(support, /Settings → Language/);
  assert.match(support, /kisi_sayisi/);
});

test('the Turkish pages keep their content and now state the same facts', async () => {
  const privacy = await html('/privacy/');
  assert.match(privacy, /Rehber izni yalnızca/);
  assert.match(privacy, /Çevrimiçi\s+RSVP hizmeti yoktur/);
  assert.match(privacy, /yalnız cihazınızda yerel olarak saklanır/);
  const data = await html('/data-retention/');
  assert.match(data, /fotoğraflar yedek dosyasına dahil edilmez/);
  const support = await html('/support/');
  assert.match(support, /Uygulama dilini nasıl değiştirebilirim\?/);
  assert.match(support, /Davetli CSV başlıkları nelerdir\?/);
});

function listHtmlFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const full = join(directory, name);
    if (statSync(full).isDirectory()) return name === 'assets' ? [] : listHtmlFiles(full);
    return name.endsWith('.html') && name !== '404.html' ? [full] : [];
  });
}

test('the static export contains every Turkish and English route', () => {
  for (const route of [...trRoutes, ...enRoutes]) {
    assert.ok(existsSync(new URL(route.file, clientDir)), `${route.file} is exported`);
  }
  const exported = listHtmlFiles(clientRoot).map((file) => relative(clientRoot, file).replace(/\\/g, '/'));
  assert.deepEqual(
    exported.sort(),
    [...trRoutes, ...enRoutes].map((route) => route.file).sort(),
    'no unexpected pages in the export',
  );
});

test('static pages declare their language on the content wrapper', () => {
  for (const route of trRoutes) assert.match(readFileSync(new URL(route.file, clientDir), 'utf8'), /<div lang="tr">/);
  for (const route of enRoutes) assert.match(readFileSync(new URL(route.file, clientDir), 'utf8'), /<div lang="en">/);
});

test('every internal link and asset in the static export resolves to a file', () => {
  const root = clientRoot;
  const broken = [];
  for (const route of [...trRoutes, ...enRoutes]) {
    const markup = readFileSync(new URL(route.file, clientDir), 'utf8');
    const links = [...markup.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    for (const link of links) {
      if (/^(mailto:|https?:|#|data:)/.test(link)) continue;
      if (!link.startsWith('/')) continue;
      const pathname = link.split('#')[0].split('?')[0];
      if (basePath && !pathname.startsWith(`${basePath}/`) && pathname !== basePath) {
        broken.push(`${route.file}: ${link} is missing the ${basePath} prefix`);
        continue;
      }
      const local = basePath ? pathname.slice(basePath.length) || '/' : pathname;
      const candidates = [local, `${local.replace(/\/$/, '')}/index.html`, `${local.replace(/\/$/, '')}.html`];
      if (
        !candidates.some((candidate) => existsSync(join(root, candidate)) && statSync(join(root, candidate)).isFile())
      ) {
        broken.push(`${route.file}: ${link}`);
      }
    }
  }
  assert.deepEqual(broken, []);
});
