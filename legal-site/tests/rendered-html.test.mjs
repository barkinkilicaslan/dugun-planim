import assert from 'node:assert/strict';
import test from 'node:test';

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

test('server-renders the branded and accessible home page', async () => {
  const response = await render('/');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Düğün Planım/);
  assert.match(html, /Planınız sizin/);
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /class="skip-link"/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
});

for (const [pathname, expected] of [
  ['/privacy/', 'Gizlilik Politikası'],
  ['/terms/', 'Kullanım Koşulları'],
  ['/support/', 'Destek ve Sık Sorulan Sorular'],
  ['/data-retention/', 'Veri Saklama ve Silme'],
]) {
  test(`renders ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(expected));
  });
}
