import {
  createExportFile,
  EXPORT_MAX_AGE_MS,
  EXPORT_PREVIOUS_MAX_AGE_MS,
  legacyExportMatchers,
  purgeExportFiles,
  purgeLegacyExportFiles,
  removeAllExportFiles,
  safeFilename,
} from '@/services/export-files';
import { shareHtmlAsPdf, shareTextFile } from '@/services/export';
import { createTranslator } from '@/i18n';
import { fakeFs } from './fake-file-system';

jest.mock('expo-file-system', () => {
  const fake = require('./fake-file-system');
  return { File: fake.FakeFile, Directory: fake.FakeDirectory, Paths: fake.fakePaths };
});
const mockShare = jest.fn().mockResolvedValue(undefined);
let mockSharingAvailable = true;
jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => Promise.resolve(mockSharingAvailable),
  shareAsync: (...args: unknown[]) => mockShare(...args),
}));
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => {
    require('./fake-file-system').fakeFs.addFile('/cache/Print/abc-123.pdf', 'pdf');
    return { uri: 'file:///cache/Print/abc-123.pdf' };
  }),
}));

const NOW = 1_790_000_000_000;
const EXPORTS = '/cache/dugun-planim-exports';

beforeEach(() => {
  fakeFs.reset();
  mockShare.mockReset();
  mockShare.mockResolvedValue(undefined);
  mockSharingAvailable = true;
});

describe('export file location and naming', () => {
  it('writes each export into its own timestamped folder inside the app export directory', () => {
    const file = createExportFile('yedek / özel:ad.json', NOW);
    expect((file as unknown as { path: string }).path).toBe(`${EXPORTS}/${NOW}/yedek----zel-ad.json`);
    expect(fakeFs.nodes.get(`${EXPORTS}/${NOW}`)).toEqual({ kind: 'dir' });
  });

  it('shares a backup from the export directory and removes the previous export first', async () => {
    fakeFs.addFile(`${EXPORTS}/${NOW - 1000}/eski.json`, 'eski');
    await shareTextFile('dugun-planim-yedek-2026-10-09.json', '{"a":1}', 'application/json');
    const files = fakeFs.files();
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(new RegExp(`^${EXPORTS}/\\d{13}/dugun-planim-yedek-2026-10-09\\.json$`));
    expect(fakeFs.nodes.get(files[0])).toEqual({ kind: 'file', text: '{"a":1}' });
    expect(mockShare).toHaveBeenCalledWith(
      `file://${files[0]}`,
      expect.objectContaining({ mimeType: 'application/json' }),
    );
    // Eski kalıntılar ve doğrudan önbellek kökü kullanılmaz.
    expect(fakeFs.nodes.has('/cache/dugun-planim-yedek-2026-10-09.json')).toBe(false);
  });

  it('moves a printed PDF into the export directory and deletes the temporary print file', async () => {
    await shareHtmlAsPdf('dugun-planim-butce.pdf', '<p>x</p>');
    const files = fakeFs.files();
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(new RegExp(`^${EXPORTS}/\\d{13}/dugun-planim-butce\\.pdf$`));
    expect(fakeFs.nodes.has('/cache/Print/abc-123.pdf')).toBe(false);
    expect(mockShare).toHaveBeenCalledWith(
      `file://${files[0]}`,
      expect.objectContaining({ mimeType: 'application/pdf' }),
    );
  });
});

describe('safeFilename', () => {
  it.each(['..', '.', '...', ''])('never lets %j resolve to a parent directory', (name) => {
    expect(safeFilename(name)).toBe('export');
  });

  it('neutralises separators and keeps normal names', () => {
    expect(safeFilename('../../etc/passwd')).toBe('..-..-etc-passwd');
    expect(safeFilename('a\\b/c.json')).toBe('a-b-c.json');
    expect(safeFilename('dugun-planim-yedek-2026-10-09.json')).toBe('dugun-planim-yedek-2026-10-09.json');
  });
});

describe('retention windows', () => {
  it('keeps a just-made export while a share target may still read it, but not for long', async () => {
    expect(EXPORT_PREVIOUS_MAX_AGE_MS).toBeLessThanOrEqual(10 * 60 * 1000);
    expect(EXPORT_MAX_AGE_MS).toBeLessThanOrEqual(2 * 60 * 60 * 1000);
    const recent = Date.now() - 60 * 1000;
    fakeFs.addFile(`${EXPORTS}/${recent}/az-once.json`);
    await shareTextFile('yeni.json', '{}', 'application/json');
    expect(fakeFs.files().some((path) => path.endsWith('/az-once.json'))).toBe(true);
    expect(fakeFs.files().some((path) => path.endsWith('/yeni.json'))).toBe(true);
  });

  it('removes an export that is older than the previous-export window when a new one starts', async () => {
    const old = Date.now() - 2 * EXPORT_PREVIOUS_MAX_AGE_MS;
    fakeFs.addFile(`${EXPORTS}/${old}/eski.json`);
    await shareTextFile('yeni.json', '{}', 'application/json');
    expect(fakeFs.files().some((path) => path.endsWith('/eski.json'))).toBe(false);
  });
});

describe('purgeExportFiles', () => {
  it('also removes folders stamped in the future (device clock was moved back)', () => {
    fakeFs.addFile(`${EXPORTS}/${NOW + 10_000_000}/gelecek.json`);
    expect(purgeExportFiles(0, NOW)).toEqual({ removed: 1, failed: 0 });
    expect(fakeFs.files()).toEqual([]);
  });

  it('removes every app export by default but never touches unrelated entries', () => {
    fakeFs.addFile(`${EXPORTS}/${NOW - 5000}/a.json`);
    fakeFs.addFile(`${EXPORTS}/${NOW}/b.csv`);
    fakeFs.addFile(`${EXPORTS}/benim-klasorum/not.txt`);
    fakeFs.addFile(`${EXPORTS}/readme.txt`);
    fakeFs.addFile('/cache/baska-uygulama.json');
    fakeFs.addFile('/document/personal-invitations/x.png');
    expect(purgeExportFiles(0, NOW + 1)).toEqual({ removed: 2, failed: 0 });
    expect(fakeFs.files()).toEqual([
      '/cache/baska-uygulama.json',
      `${EXPORTS}/benim-klasorum/not.txt`,
      `${EXPORTS}/readme.txt`,
      '/document/personal-invitations/x.png',
    ]);
  });

  it('only removes exports older than the maximum age', () => {
    const half = 30 * 60 * 1000;
    fakeFs.addFile(`${EXPORTS}/${NOW - half - 1}/eski.json`);
    fakeFs.addFile(`${EXPORTS}/${NOW - 60_000}/yeni.json`);
    expect(purgeExportFiles(half, NOW)).toEqual({ removed: 1, failed: 0 });
    expect(fakeFs.files()).toEqual([`${EXPORTS}/${NOW - 60_000}/yeni.json`]);
  });

  it('is a no-op when nothing was ever exported', () => {
    expect(purgeExportFiles(0, NOW)).toEqual({ removed: 0, failed: 0 });
  });

  it('counts failures instead of throwing, and keeps deleting the rest', () => {
    fakeFs.addFile(`${EXPORTS}/${NOW - 2}/kilitli.json`);
    fakeFs.addFile(`${EXPORTS}/${NOW - 1}/serbest.json`);
    fakeFs.failDeleteMatching = [String(NOW - 2)];
    expect(purgeExportFiles(0, NOW)).toEqual({ removed: 1, failed: 1 });
    // Kilitli dizin silinemedi ama diğeri silindi.
    expect(fakeFs.files()).toEqual([`${EXPORTS}/${NOW - 2}/kilitli.json`]);
  });
});

describe('legacy leftovers from earlier builds', () => {
  const legacy = [
    'dugun-planim-yedek-2026-10-02.json',
    'dugun-planim-butce.csv',
    'dugun-planim-butce.pdf',
    'dugun-planim-davetliler.csv',
    'dugun-planim-masa-plani.pdf',
  ];

  it("removes only files with the app's exact known export names (both languages) and Print PDFs", () => {
    for (const name of legacy) fakeFs.addFile(`/cache/${name}`);
    const enBackup = createTranslator('en')('settings.backupFile', { date: '2026-10-03' });
    fakeFs.addFile(`/cache/${enBackup}`);
    fakeFs.addFile('/cache/Print/uuid-1.pdf');
    fakeFs.addFile('/cache/Print/uuid-2.pdf');
    // Dokunulmaması gerekenler
    fakeFs.addFile('/cache/dugun-planim-yedek-bugun.json');
    fakeFs.addFile('/cache/dugun-planim-butce.csv.bak');
    fakeFs.addFile('/cache/baska-uygulama-yedek.json');
    fakeFs.addFile('/cache/Print/not-a-pdf.txt');
    fakeFs.addFile('/cache/davetiye-ornek.png');
    fakeFs.addFile('/document/dugun-planim-butce.csv');
    const result = purgeLegacyExportFiles();
    expect(result.failed).toBe(0);
    expect(result.removed).toBe(legacy.length + 1 + 2);
    expect(fakeFs.files()).toEqual([
      '/cache/Print/not-a-pdf.txt',
      '/cache/baska-uygulama-yedek.json',
      '/cache/davetiye-ornek.png',
      '/cache/dugun-planim-butce.csv.bak',
      '/cache/dugun-planim-yedek-bugun.json',
      '/document/dugun-planim-butce.csv',
    ]);
  });

  it('builds anchored matchers (no partial matches)', () => {
    const matchers = legacyExportMatchers();
    expect(matchers.some((m) => m.test('dugun-planim-butce.csv'))).toBe(true);
    expect(matchers.some((m) => m.test('x-dugun-planim-butce.csv'))).toBe(false);
    expect(matchers.some((m) => m.test('dugun-planim-yedek-2026-10-02.json'))).toBe(true);
    expect(matchers.some((m) => m.test('dugun-planim-yedek-2026-10-02.json.tmp'))).toBe(false);
  });
});

describe('removeAllExportFiles (delete-all-data)', () => {
  it('removes the whole export directory and legacy files, and leaves everything else', () => {
    fakeFs.addFile(`${EXPORTS}/${NOW}/yedek.json`);
    fakeFs.addFile(`${EXPORTS}/garip-dosya.txt`);
    fakeFs.addFile('/cache/dugun-planim-davetliler.csv');
    fakeFs.addFile('/cache/baska.json');
    const result = removeAllExportFiles();
    expect(result.failed).toBe(0);
    expect(fakeFs.files()).toEqual(['/cache/baska.json']);
    expect(fakeFs.nodes.has(EXPORTS)).toBe(false);
  });

  it('reports failures and does not throw so the user can be told what remains', () => {
    fakeFs.addFile(`${EXPORTS}/${NOW}/yedek.json`);
    fakeFs.failDeleteMatching = ['dugun-planim-exports'];
    const result = removeAllExportFiles();
    expect(result.failed).toBeGreaterThanOrEqual(1);
    expect(fakeFs.files()).toEqual([`${EXPORTS}/${NOW}/yedek.json`]);
  });

  it('can be repeated safely', () => {
    fakeFs.addFile(`${EXPORTS}/${NOW}/yedek.json`);
    removeAllExportFiles();
    expect(removeAllExportFiles()).toEqual({ removed: 0, failed: 0 });
  });
});

describe('failed or cancelled sharing', () => {
  it('removes the written backup immediately when the share sheet fails to open', async () => {
    mockShare.mockRejectedValueOnce(new Error('paylaşım açılamadı'));
    await expect(shareTextFile('yedek.json', '{"kisi":"Test"}', 'application/json')).rejects.toThrow(
      'paylaşım açılamadı',
    );
    expect(fakeFs.files()).toEqual([]);
    expect(
      fakeFs.nodes.has(EXPORTS) ? [...fakeFs.nodes.keys()].filter((key) => key.startsWith(EXPORTS + '/')) : [],
    ).toEqual([]);
  });

  it('removes the file when sharing is not available on the device', async () => {
    mockSharingAvailable = false;
    await expect(shareTextFile('liste.csv', 'a,b', 'text/csv')).rejects.toThrow();
    expect(fakeFs.files()).toEqual([]);
  });

  it('removes the PDF copy when sharing fails and leaves no print leftovers', async () => {
    mockShare.mockRejectedValueOnce(new Error('paylaşım açılamadı'));
    await expect(shareHtmlAsPdf('masalar.pdf', '<p>x</p>')).rejects.toThrow('paylaşım açılamadı');
    expect(fakeFs.files()).toEqual([]);
  });

  it('keeps the file after the share sheet is dismissed (cancel and success look the same) and relies on the retention windows', async () => {
    await shareTextFile('yedek.json', '{}', 'application/json');
    expect(fakeFs.files()).toHaveLength(1);
    // Beş dakika sonra yeni bir dışa aktarma başlarken silinir.
    purgeExportFiles(EXPORT_PREVIOUS_MAX_AGE_MS, Date.now() + EXPORT_PREVIOUS_MAX_AGE_MS + 1000);
    expect(fakeFs.files()).toEqual([]);
  });
});
