import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listMigrationFiles } from './migrator-factory.service.js';

describe('listMigrationFiles', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'migrations-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  const touch = (...files: string[]) =>
    files.forEach((file) => writeFileSync(join(directory, file), ''));

  it('lists TypeScript sources in name order', () => {
    touch('20210830-B.ts', '20210822-A.ts');

    expect(listMigrationFiles(directory)).toEqual([
      { name: '20210822-A.ts', path: join(directory, '20210822-A.ts') },
      { name: '20210830-B.ts', path: join(directory, '20210830-B.ts') },
    ]);
  });

  it('reports compiled .js files under their .ts name, as stored in SequelizeMeta', () => {
    touch('20210822-A.js', '20210822-A.js.map', '20210822-A.d.ts');

    expect(listMigrationFiles(directory)).toEqual([
      { name: '20210822-A.ts', path: join(directory, '20210822-A.js') },
    ]);
  });

  it('ignores files that are not migrations', () => {
    touch('README.md', '.gitkeep');

    expect(listMigrationFiles(directory)).toEqual([]);
  });
});
