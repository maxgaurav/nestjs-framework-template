import { Module } from '@nestjs/common';
import { DatabaseConfigService } from './services/database-config/database-config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectionNames } from './connection-names';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: DatabaseConfigService,
      imports: [ConfigModule],
      name: ConnectionNames.DefaultConnection,
    }),
  ],
  providers: [ConfigService, DatabaseConfigService],
  exports: [SequelizeModule],
})
export class DatabasesModule {}
