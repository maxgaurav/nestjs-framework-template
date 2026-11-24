import { Global, Module } from '@nestjs/common';
import { DatabasesModule } from '../databases/databases.module.js';
import { TransactionProviderService } from './services/transaction-provider/transaction-provider.service.js';

@Global()
@Module({
  imports: [DatabasesModule],
  providers: [TransactionProviderService],
  exports: [TransactionProviderService],
})
export class TransactionManagerModule {}
