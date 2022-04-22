import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { LoggingService } from '../../../services/logging/logging.service';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Injectable()
export class CreateDatabaseService {
  constructor(
    private logger: LoggingService,
    private config: ConfigService,
    @InjectConnection() private connection: Sequelize,
  ) {}

  @Command({
    command: 'database:create',
    describe: 'Drop database',
    autoExit: true,
  })
  public async createDatabase() {
    return this.connection
      .getQueryInterface()
      .createDatabase(this.connection.config.database);
  }
}
