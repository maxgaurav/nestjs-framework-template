import { Injectable, Logger } from '@nestjs/common';
import { DatabaseHelperService } from '../../services/database-helper/database-helper.service';
import { Command, Option } from 'nestjs-command';
import { ConnectionNames } from '../../../databases/connection-names';
import { join } from 'path';
import { exec } from 'child_process';

@Injectable()
export class DropDatabaseService {
  constructor(
    private databaseHelper: DatabaseHelperService,
    private logger: Logger,
  ) {}

  @Command({
    command: 'database:drop',
    describe: 'Drop database',
    autoExit: true,
  })
  public async dropDatabase(
    @Option({
      name: 'connection',
      describe: 'The connection name',
      default: ConnectionNames.DefaultConnection,
      demandOption: false,
      type: 'string',
    })
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
  ) {
    const sequelizeCliPath = `${join(
      __dirname,
      '../../../../node_modules/.bin/sequelize-cli db:drop',
    )}  --url ${this.databaseHelper.databaseUrl(connectionName)}`;
    this.logger.log('Running drop database command');
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
