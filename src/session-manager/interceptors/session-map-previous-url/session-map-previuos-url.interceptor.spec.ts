import { SessionMapPreviousUrlInterceptor } from './session-map-previous-url-interceptor.service';

describe('SessionIntendedUrlInterceptor', () => {
  it('should be defined', () => {
    expect(new SessionMapPreviousUrlInterceptor()).toBeDefined();
  });
});
