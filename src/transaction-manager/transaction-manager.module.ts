import { DynamicModule, Module } from '@nestjs/common';
import { TransactionProviderService } from '../common/services/transaction-provider/transaction-provider.service';
import { DatabasesModule } from '../databases/databases.module';

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
