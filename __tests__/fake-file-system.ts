/**
 * `expo-file-system` yeni API'sinin (File, Directory, Paths) bellek içi sahtesi. Testler `jest.mock` fabrikasında
 * `require('./fake-file-system')` ile kullanır; gerçek dosya sistemine hiç dokunulmaz.
 */
type Node = { kind: 'file'; text: string } | { kind: 'dir' };

export const fakeFs = {
  nodes: new Map<string, Node>(),
  /** Silme sırasında hata verecek yol parçaları (yolun içinde geçen metin). */
  failDeleteMatching: [] as string[],
  /** Kopyalama hedefi bu metinlerden birini içeriyorsa kopyalama hata verir. */
  failCopyMatching: [] as string[],
  reset() {
    this.nodes.clear();
    this.failDeleteMatching = [];
    this.failCopyMatching = [];
    this.nodes.set('/cache', { kind: 'dir' });
    this.nodes.set('/document', { kind: 'dir' });
  },
  files(): string[] {
    return [...this.nodes.entries()]
      .filter(([, node]) => node.kind === 'file')
      .map(([path]) => path)
      .sort();
  },
  addFile(path: string, text = 'x') {
    const parts = path.split('/').filter(Boolean);
    for (let i = 1; i < parts.length; i += 1) this.nodes.set('/' + parts.slice(0, i).join('/'), { kind: 'dir' });
    this.nodes.set(path, { kind: 'file', text });
  },
};

function join(parts: unknown[]): string {
  const segments = parts.map((part) =>
    typeof part === 'string' ? part.replace('file://', '') : (part as { path: string }).path,
  );
  return ('/' + segments.join('/')).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

class FsEntry {
  path: string;
  constructor(...parts: unknown[]) {
    this.path = join(parts);
  }
  get name(): string {
    return this.path.split('/').pop() ?? '';
  }
  get uri(): string {
    return 'file://' + this.path;
  }
  get exists(): boolean {
    return fakeFs.nodes.has(this.path);
  }
  get parentDirectory(): FakeDirectory {
    return new FakeDirectory(this.path.slice(0, this.path.lastIndexOf('/')) || '/');
  }
}

export class FakeFile extends FsEntry {
  get extension(): string {
    const index = this.name.lastIndexOf('.');
    return index < 0 ? '' : this.name.slice(index);
  }
  create(options?: { intermediates?: boolean; overwrite?: boolean }) {
    const parent = this.path.slice(0, this.path.lastIndexOf('/')) || '/';
    if (!fakeFs.nodes.has(parent) && !options?.intermediates) throw new Error('parent yok');
    fakeFs.addFile(this.path, '');
  }
  write(text: string) {
    fakeFs.nodes.set(this.path, { kind: 'file', text });
  }
  text(): Promise<string> {
    const node = fakeFs.nodes.get(this.path);
    return Promise.resolve(node?.kind === 'file' ? node.text : '');
  }
  base64(): Promise<string> {
    return this.text().then((text) => Buffer.from(text).toString('base64'));
  }
  delete() {
    if (fakeFs.failDeleteMatching.some((match) => this.path.includes(match)))
      throw new Error('silinemedi: ' + this.path);
    fakeFs.nodes.delete(this.path);
  }
  copy(destination: FakeFile) {
    if (fakeFs.failCopyMatching.some((match) => destination.path.includes(match)))
      return Promise.reject(new Error('kopyalanamadı'));
    const node = fakeFs.nodes.get(this.path);
    if (node?.kind !== 'file') throw new Error('kaynak yok');
    fakeFs.addFile(destination.path, node.text);
    return Promise.resolve();
  }
}

export class FakeDirectory extends FsEntry {
  create(options?: { intermediates?: boolean; idempotent?: boolean }) {
    const parent = this.path.slice(0, this.path.lastIndexOf('/')) || '/';
    if (!fakeFs.nodes.has(parent) && !options?.intermediates) throw new Error('parent yok');
    const parts = this.path.split('/').filter(Boolean);
    for (let i = 1; i <= parts.length; i += 1) {
      const path = '/' + parts.slice(0, i).join('/');
      if (!fakeFs.nodes.has(path)) fakeFs.nodes.set(path, { kind: 'dir' });
    }
  }
  list(): (FakeFile | FakeDirectory)[] {
    if (!this.exists) throw new Error('dizin yok');
    const prefix = this.path === '/' ? '/' : this.path + '/';
    const children = new Set<string>();
    for (const path of fakeFs.nodes.keys())
      if (path.startsWith(prefix) && path !== this.path) children.add(prefix + path.slice(prefix.length).split('/')[0]);
    return [...children]
      .sort()
      .map((path) => (fakeFs.nodes.get(path)?.kind === 'dir' ? new FakeDirectory(path) : new FakeFile(path)));
  }
  delete() {
    if (fakeFs.failDeleteMatching.some((match) => this.path.includes(match)))
      throw new Error('silinemedi: ' + this.path);
    const prefix = this.path + '/';
    for (const path of [...fakeFs.nodes.keys()])
      if (path === this.path || path.startsWith(prefix)) fakeFs.nodes.delete(path);
  }
}

export const fakePaths = { cache: new FakeDirectory('/cache'), document: new FakeDirectory('/document') };
