import 'reflect-metadata';
import { LoggingDecorator } from './logging.decorator.js';

const MARKER = 'test:marker';
const Mark = (): MethodDecorator => (_target, _key, descriptor) => {
  Reflect.defineMetadata(MARKER, 'kept', descriptor.value as object);
};

class Sample {
  @LoggingDecorator({ messageBefore: 'before', messageAfter: 'after' })
  @Mark()
  public async token(value: number): Promise<number> {
    return Promise.resolve(value * 2);
  }
}

describe('LoggingDecorator', () => {
  it('keeps the original method name (Swagger derives operation ids from it)', () => {
    expect(Sample.prototype.token.name).toEqual('token');
  });

  it('keeps metadata set by decorators applied before it', () => {
    expect(Reflect.getMetadata(MARKER, Sample.prototype.token)).toEqual('kept');
  });

  it('still calls through to the original method', async () => {
    expect(await new Sample().token(21)).toEqual(42);
  });
});
