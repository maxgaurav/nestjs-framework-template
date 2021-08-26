import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class MethodChangeMiddleware implements NestMiddleware {
  protected allowedMethods = ['put', 'get', 'delete', 'post', 'patch', 'head'];

  use(req: Request, res: any, next: () => void) {
    let overrideMethod: string | any = req.method;
    if (typeof req.body === 'object') {
      overrideMethod = req.body._method || req.method;
      if (typeof overrideMethod !== 'string') {
        overrideMethod = req.method;
      }

      if (
        !this.allowedMethods.includes((overrideMethod as string).toLowerCase())
      ) {
        overrideMethod = req.method;
      }
    }
    req.method = (overrideMethod as string).toUpperCase();
    next();
  }
}
