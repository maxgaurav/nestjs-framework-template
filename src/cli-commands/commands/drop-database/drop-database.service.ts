import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { LoggingService } from '../../../services/logging/logging.service';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Injectable()
export class DropDatabaseService {
  constructor(
    private logger: LoggingService,
    private config: ConfigService,
    @InjectConnection() private connection: Sequelize,
  ) {}

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
