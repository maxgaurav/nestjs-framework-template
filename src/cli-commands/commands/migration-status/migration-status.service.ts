import { Injectable } from '@nestjs/common';
import { ConnectionNames } from '../../../databases/connection-names.js';
import { MigratorFactoryService } from '../../services/migrator-factory/migrator-factory.service.js';

export type MigrationState = 'up' | 'pending' | 'missing';

export interface MigrationStatusEntry {
  name: string;
  state: MigrationState;
}

/**
 * Combines the executed (SequelizeMeta) and pending migrations into one ordered list.
 * `missing`: recorded as executed but its file is gone, so it cannot be rolled back.
 */
export const migrationStatus = (
  recorded: string[],
  pending: string[],
  files: string[],
): MigrationStatusEntry[] => {
  const known = new Set(files);
  return [
    ...recorded.map((name) => ({
      name,
      state: (known.has(name) ? 'up' : 'missing') as MigrationState,
    })),
    ...pending.map((name) => ({ name, state: 'pending' as MigrationState })),
  ].sort((a, b) => a.name.localeCompare(b.name));
};

export const formatMigrationStatus = (
  entries: MigrationStatusEntry[],
): string => {
  const width = Math.max(
    ...entries.map((e) => e.state.length),
    'pending'.length,
  );
  const lines = entries.map((e) => `${e.state.padEnd(width)}  ${e.name}`);
  const count = (state: MigrationState) =>
    entries.filter((e) => e.state === state).length;
  const summary = [`${count('up')} up`, `${count('pending')} pending`];
  if (count('missing') > 0) {
    summary.push(`${count('missing')} missing`);
  }
  return [...lines, summary.join(', ')].join('\n');
};

@Injectable()
export class MigrationStatusService {
  constructor(private readonly migratorFactory: MigratorFactoryService) {}

  public async status(
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
  ): Promise<MigrationStatusEntry[]> {
    const migrator = this.migratorFactory.create(connectionName);
    const [recorded, executed, pending] = await Promise.all([
      this.migratorFactory.executedNames(),
      migrator.executed(),
      migrator.pending(),
    ]);
    // Files on disk = executed (with a file) + pending
    return migrationStatus(
      recorded,
      pending.map((m) => m.name),
      [...executed, ...pending].map((m) => m.name),
    );
  }
}
