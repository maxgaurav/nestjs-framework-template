import { ResourceConversionInterceptor } from './resource-conversion.interceptor';

describe('ResourceConversionInterceptor', () => {
  it('should be defined', () => {
    expect(new ResourceConversionInterceptor('test' as any)).toBeDefined();
  });
});
