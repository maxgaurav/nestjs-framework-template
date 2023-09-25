import { ResourceConversionInterceptor } from './resource-conversion.interceptor';
import { Test, TestingModule } from '@nestjs/testing';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, from, Observable, of } from 'rxjs';
import { Expose } from 'class-transformer';
import { Reflector } from '@nestjs/core';
import { ResourceMap } from '../../decorators/resource-map.decorator';

class SampleResource {
  @Expose()
  public ok: string;
}

describe('ResourceConversionInterceptor', () => {
  let interceptor: ResourceConversionInterceptor;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [ResourceConversionInterceptor],
    }).compile();

    interceptor = module.get(ResourceConversionInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should return null value as it is', async () => {
    const next = {
      handle(): Observable<any> {
        return of(null);
      },
    } as CallHandler;
    expect(
      await firstValueFrom(interceptor.intercept({} as any, next)),
    ).toEqual(null);
  });

  it('should convert objects to resource when result is an object', async () => {
    const next = {
      handle(): Observable<any> {
        return of({ ok: 'true' });
      },
    } as CallHandler;

    const context: ExecutionContext = {
      getClass: () => 'className',
      getHandler: () => 'handlerName',
    } as any;

    const reflector = module.get<Reflector>(Reflector);
    const getOverrideSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(SampleResource);

    expect(
      await firstValueFrom(interceptor.intercept(context, next)),
    ).toBeInstanceOf(SampleResource);
    expect(getOverrideSpy).toHaveBeenCalledWith(ResourceMap, [
      'handlerName',
      'className',
    ]);
  });

  it('should convert array of objects to array of resource when result is an array of objects', async () => {
    const next = {
      handle(): Observable<any> {
        return from(Promise.resolve([{ ok: 'true' }]));
      },
    } as CallHandler;

    const context: ExecutionContext = {
      getClass: () => 'className',
      getHandler: () => 'handlerName',
    } as any;

    const reflector = module.get<Reflector>(Reflector);
    const getOverrideSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(SampleResource);

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(Array.isArray(result)).toEqual(true);
    expect(result[0]).toBeInstanceOf(SampleResource);
    expect(getOverrideSpy).toHaveBeenCalledWith(ResourceMap, [
      'handlerName',
      'className',
    ]);
  });
});
