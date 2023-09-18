import { RedirectRouteInterceptor } from './redirect-route.interceptor';
import { Test, TestingModule } from '@nestjs/testing';

describe('RedirectRouteInterceptor', () => {
  let interceptor: RedirectRouteInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedirectRouteInterceptor],
    }).compile();

    interceptor = module.get<RedirectRouteInterceptor>(
      RedirectRouteInterceptor,
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it.todo('should call the redirect handler and redirect');

  it('should resolve promise when session is saved', async () => {
    const request = { session: { save: (value) => value } };

    const saveSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: () => void) => {
        callback();
      });

    expect(await interceptor.saveSession(request as any)).toEqual(true);
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should reject promise with session save error', async () => {
    const request = { session: { save: (value) => value } };

    const saveSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: (err: string) => void) => {
        callback('error');
      });

    let errorThrown = false;
    try {
      await interceptor.saveSession(request as any);
    } catch (err) {
      if (err === 'error') {
        errorThrown = true;
      }
    }
    expect(errorThrown).toEqual(true);
    expect(saveSpy).toHaveBeenCalled();
  });
});
