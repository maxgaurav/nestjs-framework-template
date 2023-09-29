import { ClearAuthorizationTrackingStatesInterceptor } from './clear-authorization-tracking-states.interceptor';
import { Test, TestingModule } from '@nestjs/testing';

describe('ClearAuthorizationTrackingStatesInterceptor', () => {
  let interceptor: ClearAuthorizationTrackingStatesInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [ClearAuthorizationTrackingStatesInterceptor],
    }).compile();

    interceptor = await module.resolve(
      ClearAuthorizationTrackingStatesInterceptor,
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });
});
