import { Injectable, Logger } from '@nestjs/common';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';
import { Command, Option } from 'nestjs-command';
import { ConnectionNames } from '../../../databases/connection-names';
import { join } from 'path';
import { exec } from 'child_process';

@Injectable()
export class RollbackMigrationService {
  constructor(
    private databaseHelper: DatabaseHelperService,
    private logger: Logger,
  ) {}

  @Command({
    command: 'migration:rollback',
    describe:
      'Roll back last migration or till the migration point provided as till',
    autoExit: true,
  })
  public async runMigration(
    @Option({
      name: 'connection',
      describe: 'The connection name',
      default: ConnectionNames.DefaultConnection,
      demandOption: false,
      type: 'string',
    })
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
    @Option({
      name: 'till',
      describe: 'The file name of migration to revert back to',
      default: '',
      demandOption: false,
      type: 'string',
    })
    till?: string,
  ) {
    let sequelizeCliPath = `${join(
      __dirname,
      '../../../../node_modules/.bin/sequelize-cli db:migrate:undo',
    )}  --url ${this.databaseHelper.databaseUrl(
      connectionName,
    )} --migrations-path ${this.databaseHelper.migrationPath(
      connectionName,
      true,
    )}`;

    if (!!till) {
      sequelizeCliPath = `${sequelizeCliPath} --to ${till}`;
    }

    this.logger.log('Running migration command');
    this.logger.log(sequelizeCliPath);
    await new Promise((resolve, reject) => {
      const process = exec(sequelizeCliPath);
      process.stdout.addListener('data', (chunk) => console.log(chunk));
      process.addListener('exit', (code, signal) => {
        if (code === 0) {
          resolve([code, signal]);
        } else {
          reject([code, signal]);
        }
      });
      process.addListener('error', (err) => {
        this.logger.error(err);
        reject(err);
      });
    });
  }
}
