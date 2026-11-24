import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { StorageError, StorageServiceError } from '@nestjs/storage';

/**
 * @nestjs/storage errors are not HttpExceptions. Map them to the HTTP status they carry
 * (400 / 403 / 404 / 409 / 416); a failing storage service is a 502.
 */
@Catch(StorageError)
export class StorageErrorFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(StorageErrorFilter.name);

  override catch(exception: StorageError, host: ArgumentsHost) {
    super.catch(this.toHttpException(exception), host);
  }

  public toHttpException(exception: StorageError): HttpException {
    if (exception instanceof StorageServiceError) {
      this.logger.error(
        {
          message: 'Storage service request failed',
          operation: exception.operation,
          code: exception.code,
          upstreamStatus: exception.upstreamStatus,
          requestId: exception.requestId,
        },
        exception.stack,
      );
      return new HttpException('Storage unavailable', HttpStatus.BAD_GATEWAY);
    }

    const status =
      (exception as StorageError & { status?: number }).status ??
      HttpStatus.INTERNAL_SERVER_ERROR;
    return new HttpException(exception.message, status, { cause: exception });
  }
}
