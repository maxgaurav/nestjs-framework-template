import {
  formatMigrationStatus,
  migrationStatus,
} from './migration-status.service.js';

describe('migration status', () => {
  const entries = migrationStatus(
    ['2021-A.ts', '2021-B.ts', '2022-GONE.ts'],
    ['2023-C.ts'],
    ['2021-A.ts', '2021-B.ts', '2023-C.ts'],
  );

  it('marks executed migrations up, unexecuted pending, and recorded-without-file missing', () => {
    expect(entries).toEqual([
      { name: '2021-A.ts', state: 'up' },
      { name: '2021-B.ts', state: 'up' },
      { name: '2022-GONE.ts', state: 'missing' },
      { name: '2023-C.ts', state: 'pending' },
    ]);
  });

  it('prints one aligned line per migration and a summary', () => {
    expect(formatMigrationStatus(entries).split('\n')).toEqual([
      'up       2021-A.ts',
      'up       2021-B.ts',
      'missing  2022-GONE.ts',
      'pending  2023-C.ts',
      '2 up, 1 pending, 1 missing',
    ]);
  });

  it('omits the missing count when there are none', () => {
    expect(
      formatMigrationStatus(migrationStatus(['A.ts'], [], ['A.ts'])),
    ).toEqual('up       A.ts\n1 up, 0 pending');
  });
});
