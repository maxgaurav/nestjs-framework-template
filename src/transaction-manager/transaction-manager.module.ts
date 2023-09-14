import { Global, Module } from '@nestjs/common';
import { DatabasesModule } from '../databases/databases.module';
import { TransactionProviderService } from './services/transaction-provider/transaction-provider.service';

@Global()
@Module({
  imports: [DatabasesModule],
  providers: [TransactionProviderService],
  exports: [TransactionProviderService],
})
export class TransactionManagerModule {}
