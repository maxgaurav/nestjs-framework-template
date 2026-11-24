import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class MethodChangeMiddleware implements NestMiddleware {
  protected allowedMethods = ['put', 'get', 'delete', 'post', 'patch', 'head'];

  use(req: Request, res: any, next: () => void) {
    let overrideMethod = req.method;
    const requestedMethod: unknown = (
      req.body as { _method?: unknown } | null | undefined
    )?._method;

    // Only a string from the allow-list may override; anything else (numbers, arrays from
    // `_method[]=x`, objects) is ignored instead of crashing the request
    if (
      typeof requestedMethod === 'string' &&
      this.allowedMethods.includes(requestedMethod.toLowerCase())
    ) {
      overrideMethod = requestedMethod;
    }
    req.method = overrideMethod.toUpperCase();
    next();
  }
}
