import { HttpStatus, Logger } from '@nestjs/common';
import {
  StorageError,
  StorageFileNotFoundError,
  StorageInvalidKeyError,
  StorageKeyConflictError,
  StorageRangeNotSatisfiableError,
  StorageServiceError,
  StorageSignedUrlError,
} from '@nestjs/storage';
import { StorageErrorFilter } from './storage-error.filter.js';

describe('StorageErrorFilter', () => {
  const filter = new StorageErrorFilter();

  it.each([
    [new StorageInvalidKeyError('../escape'), HttpStatus.BAD_REQUEST],
    [new StorageSignedUrlError('expired'), HttpStatus.FORBIDDEN],
    [new StorageFileNotFoundError('missing.txt'), HttpStatus.NOT_FOUND],
    [new StorageKeyConflictError('taken.txt'), HttpStatus.CONFLICT],
    [
      new StorageRangeNotSatisfiableError('file.txt', 10),
      HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
    ],
  ])('maps %s to its HTTP status', (error, status) => {
    expect(filter.toHttpException(error).getStatus()).toEqual(status);
  });

  it('maps a failing storage service to 502 and logs its details', () => {
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const error = new StorageServiceError({
      operation: 'put',
      code: 'SlowDown',
      upstreamStatus: 503,
      requestId: 'req-1',
    });

    const exception = filter.toHttpException(error);

    expect(exception.getStatus()).toEqual(HttpStatus.BAD_GATEWAY);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'put', code: 'SlowDown' }),
      expect.any(String),
    );
  });

  it('maps an unknown storage error to 500', () => {
    expect(
      filter.toHttpException(new StorageError('unexpected')).getStatus(),
    ).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
