import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class MethodChangeMiddleware implements NestMiddleware {
  protected allowedMethods = ['put', 'get', 'delete', 'post', 'patch', 'head'];

  use(req: Request, res: any, next: () => void) {
    let overrideMethod = req.method;
    if (typeof req.body === 'object') {
      overrideMethod =
        (req.body as never as { _method?: string | undefined })._method ||
        req.method;

      if (!this.allowedMethods.includes(overrideMethod.toLowerCase())) {
        overrideMethod = req.method;
      }
    }
    req.method = overrideMethod.toUpperCase();
    next();
  }
}
