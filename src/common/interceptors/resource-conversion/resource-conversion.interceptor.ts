import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { RESOURCE_MAP_KEY } from '../../decorators/resource-map.decorator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ResourceConversionInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const instanceType = this.reflector.getAllAndOverride<{
      new (...args: any[]): any;
    }>(RESOURCE_MAP_KEY, [context.getHandler(), context.getClass()]);

    return next.handle().pipe(
      map((content) => {
        if (!content) {
          return content;
        }

        if (content instanceof Array) {
          return content.map((mappedContent) =>
            plainToInstance(instanceType, mappedContent, {
              excludeExtraneousValues: true,
            }),
          );
        }

        return plainToInstance(instanceType, content, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
