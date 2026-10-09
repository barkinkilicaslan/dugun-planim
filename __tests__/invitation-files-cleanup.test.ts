import { renderInvitationPdf, renderInvitationPng } from '@/services/invitation-files';
import { fakeFs } from './fake-file-system';

jest.mock('expo-file-system', () => {
  const fake = require('./fake-file-system');
  return { File: fake.FakeFile, Directory: fake.FakeDirectory, Paths: fake.fakePaths };
});
jest.mock('expo-sharing', () => ({ isAvailableAsync: () => Promise.resolve(true), shareAsync: jest.fn() }));
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(async () => {
    require('./fake-file-system').fakeFs.addFile('/cache/ReactNative-snapshot-image-1.png', 'png');
    return 'file:///cache/ReactNative-snapshot-image-1.png';
  }),
}));
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => {
    require('./fake-file-system').fakeFs.addFile('/cache/Print/uuid.pdf', 'pdf');
    return { uri: 'file:///cache/Print/uuid.pdf' };
  }),
}));

beforeEach(() => fakeFs.reset());

describe('temporary invitation files', () => {
  it('removes the captured PNG after a successful copy', async () => {
    const result = await renderInvitationPng({} as never, 'davetiye-test', 1);
    expect(result.filename).toBe('davetiye-test.png');
    expect(fakeFs.files()).toEqual(['/cache/davetiye-test.png']);
  });

  it('removes the captured PNG even when copying it fails (no plaintext leftover)', async () => {
    fakeFs.failCopyMatching = ['davetiye-test'];
    await expect(renderInvitationPng({} as never, 'davetiye-test', 1)).rejects.toThrow('kopyalanamadı');
    expect(fakeFs.files()).toEqual([]);
  });

  it('removes the printed PDF even when copying it fails', async () => {
    fakeFs.addFile('/cache/davetiye-kaynak.png', 'png');
    fakeFs.failCopyMatching = ['davetiye-test.pdf'];
    await expect(
      renderInvitationPdf(
        { uri: 'file:///cache/davetiye-kaynak.png', mimeType: 'image/png', filename: 'x.png' },
        'davetiye-test',
      ),
    ).rejects.toThrow('kopyalanamadı');
    expect(fakeFs.files()).toEqual(['/cache/davetiye-kaynak.png']);
  });
});
