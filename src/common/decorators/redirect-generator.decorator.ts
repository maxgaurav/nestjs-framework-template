import { RedirectRouteExecutorInterfaceInst } from '../../interfaces/redirect-route-executor.interface';
import { Reflector } from '@nestjs/core';

export const RedirectGenerator =
  Reflector.createDecorator<RedirectRouteExecutorInterfaceInst>();
