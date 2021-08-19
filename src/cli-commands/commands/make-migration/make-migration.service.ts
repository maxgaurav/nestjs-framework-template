import { Injectable, Logger } from '@nestjs/common';
import { Command, Option, Positional } from 'nestjs-command';
import { exec } from 'child_process';
import { join } from 'path';
import { ConnectionNames } from '../../../databases/connection-names';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';

@Injectable()
export class MakeMigrationService {
  constructor(
    private databaseHelper: DatabaseHelperService,
    private logger: Logger,
  ) {}

  @Command({
    command: 'migration:make',
    describe: 'Generates migration stub',
    autoExit: true,
  })
  public async generateStub(
    @Positional({
      name: 'name',
      describe: 'The name of migration file',
      type: 'string',
    })
    name: string,
    @Option({
      name: 'connection',
      describe: 'The connection name',
      default: ConnectionNames.DefaultConnection,
      demandOption: false,
      type: 'string',
    })
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
  ) {
    const sequelizeCliPath = join(
      __dirname,
      `../../../../node_modules/.bin/sequelize-cli migration:generate --name ${name} --migrations-path ${this.databaseHelper.migrationPath(
        connectionName,
      )}`,
    );
    this.logger.log('Running migration generation command');
    this.logger.log(sequelizeCliPath);

    await new Promise((resolve, reject) => {
      const process = exec(sequelizeCliPath);
      process.stdout.addListener('data', (chunk) => console.log(chunk));
      process.addListener('exit', (code, signal) => resolve([code, signal]));
      process.addListener('error', (err) => {
        this.logger.error(err);
        reject(err);
      });
    });
  }
}
