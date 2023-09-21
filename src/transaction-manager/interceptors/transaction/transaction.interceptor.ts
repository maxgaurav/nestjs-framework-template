import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { firstValueFrom, from, Observable } from 'rxjs';
import { TransactionProviderService } from '../../services/transaction-provider/transaction-provider.service';
import { Request } from 'express';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private transactionProvider: TransactionProviderService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    return from(
      this.transactionProvider.createManaged((transaction) => {
        request.scopeTransaction = transaction;
        return firstValueFrom(next.handle());
      }),
    );
  }
}
