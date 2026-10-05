import { Image } from 'react-native';

import {
  PersonalInvitationError,
  imageExtension,
  pickInvitationFromFiles,
  pickInvitationFromLibrary,
  preparePersonalInvitationFile,
  removePersonalInvitationFile,
  removeUnreferencedPersonalInvitationFiles,
} from '@/services/personal-invitations';

const mockLaunch = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (options: unknown) => mockLaunch(options),
  UIImagePickerPreferredAssetRepresentationMode: { Compatible: 'compatible' },
}));

const mockPickFile = jest.fn();
const mockInfo: Record<string, { size: number; name: string; type: string }> = {};
const mockCopied: { from: string; to: string }[] = [];
const mockDeleted: string[] = [];
const mockListing: string[] = [];
const mockMissing = new Set<string>();
const mockCleanup = jest.fn();
jest.mock('@/services/invitation-files', () => ({ cleanupInvitationTemp: () => mockCleanup() }));
jest.mock('expo-file-system', () => {
  class MockFile {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
    static pickFileAsync = (options: unknown) => mockPickFile(options);
    get exists() {
      return !mockMissing.has(this.uri);
    }
    get size() {
      return mockInfo[this.uri]?.size ?? 1000;
    }
    get name() {
      return mockInfo[this.uri]?.name ?? this.uri.split('/').pop() ?? '';
    }
    get type() {
      return mockInfo[this.uri]?.type ?? '';
    }
    async copy(target: { uri: string }) {
      mockCopied.push({ from: this.uri, to: target.uri });
    }
    delete() {
      mockDeleted.push(this.uri);
    }
  }
  class MockDirectory {
    uri: string;
    exists = true;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
    }
    create() {}
    delete() {}
    list() {
      return mockListing.map((uri) => new MockFile(uri));
    }
  }
  return { File: MockFile, Directory: MockDirectory, Paths: { document: 'file:///docs', cache: 'file:///cache' } };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCopied.length = 0;
  mockDeleted.length = 0;
  mockListing.length = 0;
  mockMissing.clear();
  for (const key of Object.keys(mockInfo)) delete mockInfo[key];
  jest
    .spyOn(Image, 'getSize')
    .mockImplementation(((_uri: string, success: (w: number, h: number) => void) =>
      success(1200, 1800)) as typeof Image.getSize);
});

describe('imageExtension', () => {
  it('accepts JPG and PNG by name or MIME type and rejects everything else', () => {
    expect(imageExtension('davetiye.JPG')).toBe('jpg');
    expect(imageExtension('davetiye.jpeg')).toBe('jpg');
    expect(imageExtension('davetiye.png')).toBe('png');
    expect(imageExtension('IMG_1', 'image/jpeg')).toBe('jpg');
    expect(imageExtension('IMG_1', 'image/png')).toBe('png');
    expect(imageExtension('davetiye.pdf', 'application/pdf')).toBe('');
    expect(imageExtension('IMG_1.heic', 'image/heic')).toBe('');
    expect(imageExtension(undefined, undefined)).toBe('');
  });
});

describe('pickInvitationFromLibrary', () => {
  it('opens the system photo picker for a single image and copies it into the app folder', async () => {
    mockLaunch.mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///cache/picked.jpg', fileName: 'IMG_1.jpg', mimeType: 'image/jpeg', width: 1000, height: 1500 },
      ],
    });
    const result = await pickInvitationFromLibrary('abc-123');
    expect(mockLaunch).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['images'], allowsEditing: false, selectionLimit: 1 }),
    );
    expect(result).toMatchObject({ width: 1000, height: 1500 });
    expect(result?.uri).toMatch(/^file:\/\/\/docs\/personal-invitations\/abc-123-\d+\.jpg$/);
    expect(mockCopied).toEqual([{ from: 'file:///cache/picked.jpg', to: result?.uri }]);
  });

  it('measures the copied image when the picker does not report its size', async () => {
    mockLaunch.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/p.png', mimeType: 'image/png' }],
    });
    expect(await pickInvitationFromLibrary('x')).toMatchObject({ width: 1200, height: 1800 });
  });

  it('returns nothing when the user cancels', async () => {
    mockLaunch.mockResolvedValue({ canceled: true, assets: null });
    expect(await pickInvitationFromLibrary('x')).toBeUndefined();
    expect(mockCopied).toHaveLength(0);
  });

  it('turns a denied photo permission into a clear, recoverable error', async () => {
    mockLaunch.mockRejectedValue(new Error('Permission denied by the user'));
    const failure = await pickInvitationFromLibrary('x').catch((reason) => reason);
    expect(failure).toBeInstanceOf(PersonalInvitationError);
    expect(failure.code).toBe('permission');
    expect(failure.message).toMatch(/Fotoğraflara erişim izni verilmedi/);
    expect(mockCopied).toHaveLength(0);
  });

  it('rejects unsupported formats and oversized images without copying', async () => {
    mockLaunch.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/a.heic', mimeType: 'image/heic' }],
    });
    await expect(pickInvitationFromLibrary('x')).rejects.toMatchObject({ code: 'format' });
    mockInfo['file:///cache/big.jpg'] = { size: 16 * 1024 * 1024, name: 'big.jpg', type: 'image/jpeg' };
    mockLaunch.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/big.jpg', mimeType: 'image/jpeg' }],
    });
    await expect(pickInvitationFromLibrary('x')).rejects.toMatchObject({ code: 'size' });
    expect(mockCopied).toHaveLength(0);
  });
});

describe('pickInvitationFromFiles', () => {
  it('supports JPG and PNG from the Files app and rejects PDF', async () => {
    const { File } = jest.requireMock('expo-file-system');
    const png = new File('file:///tmp/davetiye.png');
    mockInfo[png.uri] = { size: 2000, name: 'davetiye.png', type: 'image/png' };
    mockPickFile.mockResolvedValue({ canceled: false, result: png });
    const result = await pickInvitationFromFiles('id-1');
    expect(mockPickFile).toHaveBeenCalledWith({ mimeTypes: ['image/jpeg', 'image/png'], multipleFiles: false });
    expect(result?.uri).toMatch(/personal-invitations\/id-1-\d+\.png$/);

    const pdf = new File('file:///tmp/davetiye.pdf');
    mockInfo[pdf.uri] = { size: 2000, name: 'davetiye.pdf', type: 'application/pdf' };
    mockPickFile.mockResolvedValue({ canceled: false, result: pdf });
    await expect(pickInvitationFromFiles('id-2')).rejects.toMatchObject({ code: 'format' });
  });

  it('returns nothing on cancel', async () => {
    mockPickFile.mockResolvedValue({ canceled: true, result: null });
    expect(await pickInvitationFromFiles('x')).toBeUndefined();
  });
});

describe('file cleanup', () => {
  it('only deletes files inside the personal-invitations folder', async () => {
    expect(await removePersonalInvitationFile('file:///docs/personal-invitations/a-1.jpg')).toBe(true);
    expect(await removePersonalInvitationFile('file:///docs/invitation-photos/a-1.jpg')).toBe(false);
    expect(await removePersonalInvitationFile('file:///somewhere/else.jpg')).toBe(false);
    expect(await removePersonalInvitationFile(undefined)).toBe(false);
    expect(mockDeleted).toEqual(['file:///docs/personal-invitations/a-1.jpg']);
  });

  it('sweeps files that no saved invitation references', async () => {
    mockListing.push('file:///docs/personal-invitations/keep.jpg', 'file:///docs/personal-invitations/orphan.jpg');
    await removeUnreferencedPersonalInvitationFiles(['file:///docs/personal-invitations/keep.jpg']);
    expect(mockDeleted).toEqual(['file:///docs/personal-invitations/orphan.jpg']);
  });
});

describe('preparePersonalInvitationFile', () => {
  const stored = (name: string) => `file:///docs/personal-invitations/${name}`;

  it('copies the uploaded image to a shareable cache URI with a friendly file name', async () => {
    mockInfo[stored('p1-1.jpg')] = { size: 5000, name: 'p1-1.jpg', type: 'image/jpeg' };
    const file = await preparePersonalInvitationFile({ name: 'Bahçe Davetiyesi', imageUri: stored('p1-1.jpg') });
    expect(file).toEqual({
      uri: 'file:///cache/davetiye-bahce-davetiyesi.jpg',
      mimeType: 'image/jpeg',
      filename: expect.stringMatching(/\.jpg$/),
    });
    expect(mockCopied).toEqual([{ from: stored('p1-1.jpg'), to: file.uri }]);
    expect(mockCleanup).toHaveBeenCalled();
    expect(file.uri.startsWith('file://')).toBe(true);
  });

  it('keeps PNG as PNG', async () => {
    mockInfo[stored('p1-2.png')] = { size: 5000, name: 'p1-2.png', type: 'image/png' };
    expect(await preparePersonalInvitationFile({ name: 'Nişan', imageUri: stored('p1-2.png') })).toMatchObject({
      mimeType: 'image/png',
      uri: 'file:///cache/davetiye-nisan.png',
    });
  });

  it('gives a clear error when the stored file is gone, and copies nothing', async () => {
    mockMissing.add(stored('gone.jpg'));
    const failure = await preparePersonalInvitationFile({ name: 'X', imageUri: stored('gone.jpg') }).catch(
      (reason) => reason,
    );
    expect(failure).toBeInstanceOf(PersonalInvitationError);
    expect(failure.code).toBe('missing');
    expect(failure.message).toMatch(/Davetiye görseli bulunamadı/);
    expect(mockCopied).toHaveLength(0);
  });

  it('refuses paths outside the personal-invitations folder', async () => {
    await expect(
      preparePersonalInvitationFile({ name: 'X', imageUri: 'file:///somewhere/else.jpg' }),
    ).rejects.toMatchObject({ code: 'missing' });
    expect(mockCopied).toHaveLength(0);
  });
});
