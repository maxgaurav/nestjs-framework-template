import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Injectable()
export class DropDatabaseService {
  constructor(@InjectConnection() private connection: Sequelize) {}
  public async dropDatabase() {
    return this.connection
      .getQueryInterface()
      .dropDatabase(this.connection.config.database);
  }
}
