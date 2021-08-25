import { NotFoundConverterInterceptor } from './not-found-converter.interceptor';
import { firstValueFrom, of } from 'rxjs';

describe('NotFoundConverterInterceptor', () => {
  let interceptor: NotFoundConverterInterceptor;

  beforeEach(() => {
    interceptor = new NotFoundConverterInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should return correct value through interceptor', async () => {
    const context = {} as any;
    const next = { handle: () => of(true) };

    expect(await firstValueFrom(interceptor.intercept(context, next))).toEqual(
      true,
    );
  });
});
