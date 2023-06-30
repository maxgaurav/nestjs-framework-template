import { RedirectRouteExecutorInterface } from '../../interfaces/redirect-route-executor.interface';
import { SetMetadata } from '@nestjs/common';

export const REDIRECT_SERVICE_METADATA = 'REDIRECT_SERVICE_METADATA';

export const RedirectGenerator = (service: {
  new (...args: any[]): RedirectRouteExecutorInterface;
}) => SetMetadata(REDIRECT_SERVICE_METADATA, service);
