import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Injectable()
export class CreateDatabaseService {
  constructor(@InjectConnection() private connection: Sequelize) {}
  public async createDatabase() {
    return this.connection
      .getQueryInterface()
      .createDatabase(this.connection.config.database);
  }
}
