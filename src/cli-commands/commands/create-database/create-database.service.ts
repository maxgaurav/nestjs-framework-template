import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Injectable()
export class CreateDatabaseService {
  constructor(@InjectConnection() private connection: Sequelize) {}

  @Command({
    command: 'database:create',
    describe: 'Drop database',
  })
  public async createDatabase() {
    return this.connection
      .getQueryInterface()
      .createDatabase(this.connection.config.database);
  }
}
