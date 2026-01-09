import { Injectable, Logger } from '@nestjs/common';
import { Command, Positional } from 'nestjs-command';
import { join } from 'path';
import { Umzug } from 'umzug';
import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { ConnectionNames } from '../../../databases/connection-names';
import { DatabaseConnectionConfig } from '../../../environment/environment-types.interface';

@Injectable()
export class MakeMigrationService {
  constructor(
    private logger: Logger,
    private config: ConfigService,
  ) {}

  @Command({
    command: 'migration:make',
    describe: 'Generates migration stub',
  })
  public async generateStub(
    @Positional({
      name: 'name',
      describe: 'The name of migration file',
      type: 'string',
    })
    name: string,
  ) {
    const stubFileContents: string = readFileSync(
      join(
        process.cwd(),
        'src',
        'cli-commands',
        'commands',
        'make-migration',
        'migration.stub',
      ),
    ).toString('utf-8');
    const connectionConfig =
      this.config.getOrThrow<Record<ConnectionNames, DatabaseConnectionConfig>>(
        'databases',
      )[ConnectionNames.DefaultConnection];
    const umzug = new Umzug({
      migrations: {
        glob: `${connectionConfig.migrationDirectory}/*.ts`,
      },
      create: {
        template: (filepath) => [[filepath, stubFileContents]],
      },
      logger: this.logger as any,
    });

    const prefix = new Intl.DateTimeFormat('en', {
      month: '2-digit',
      year: 'numeric',
      second: '2-digit',
      day: '2-digit',
      minute: '2-digit',
      hour: '2-digit',
    })
      .formatToParts(new Date())
      .reduce<string[]>((dateFormat, formatPart) => {
        let index: number;
        switch (formatPart.type) {
          case 'year':
            index = 0;
            break;
          case 'month':
            index = 1;
            break;
          case 'day':
            index = 2;
            break;
          case 'hour':
            index = 3;
            break;
          case 'minute':
            index = 4;
            break;
          case 'second':
            index = 5;
            break;
          default:
            return dateFormat;
        }
        dateFormat[index] = formatPart.value;
        return dateFormat;
      }, new Array(6))
      .join('');

    return umzug.create({ name: `${prefix}-${name}.ts`, prefix: 'NONE' });
  }
}
