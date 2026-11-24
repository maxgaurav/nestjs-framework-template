import { RedirectRouteExecutorInterfaceInst } from '../../interfaces/redirect-route-executor.interface.js';
import { Reflector } from '@nestjs/core';

export const RedirectGenerator =
  Reflector.createDecorator<RedirectRouteExecutorInterfaceInst>();
