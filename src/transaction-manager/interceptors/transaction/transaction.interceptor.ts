import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Transaction } from 'sequelize';
import { TransactionProviderService } from '../../services/transaction-provider/transaction-provider.service';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private transactionProvider: TransactionProviderService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: {
      scopeTransaction: Transaction;
    } = context.switchToHttp().getRequest();
    return from(this.transactionProvider.create())
      .pipe(
        switchMap((transaction: Transaction) => {
          request.scopeTransaction = transaction;
          return next.handle();
        }),
      )
      .pipe(
        switchMap((result) =>
          from(request.scopeTransaction.commit()).pipe(map(() => result)),
        ),
      )
      .pipe(
        catchError((err) =>
          from(request.scopeTransaction.rollback()).pipe(
            switchMap(() => throwError(err)),
          ),
        ),
      );
  }
}
