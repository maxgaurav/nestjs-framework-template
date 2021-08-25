import { DynamicModule, Module } from '@nestjs/common';
import { DatabasesModule } from '../databases/databases.module';
import { TransactionProviderService } from './services/transaction-provider/transaction-provider.service';

@Module({})
export class TransactionManagerModule {
  static register(): DynamicModule {
    return {
      imports: [DatabasesModule],
      module: TransactionManagerModule,
      providers: [TransactionProviderService],
      global: true,
      exports: [TransactionProviderService],
    };
  }
}
