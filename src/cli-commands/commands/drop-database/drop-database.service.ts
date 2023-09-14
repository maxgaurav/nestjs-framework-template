import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Injectable()
export class DropDatabaseService {
  constructor(@InjectConnection() private connection: Sequelize) {}

  @Command({
    command: 'database:drop',
    describe: 'Drop database',
  })
  public async dropDatabase() {
    return this.connection
      .getQueryInterface()
      .dropDatabase(this.connection.config.database);
  }
}
