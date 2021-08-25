import { Test, TestingModule } from '@nestjs/testing';
import { EventRegisterCallbackService } from './event-register-callback.service';

describe('EventRegisterCallbackService', () => {
  let service: EventRegisterCallbackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventRegisterCallbackService],
    }).compile();

    service = module.get<EventRegisterCallbackService>(
      EventRegisterCallbackService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should execute transaction callback if transaction if provided', async () => {
    let callbackCalled = false;
    let afterCommitCalled = false;
    const callback = () => (callbackCalled = true) as any;

    const transaction = {
      afterCommit: (handler) => {
        afterCommitCalled = true;
        handler();
      },
    } as any;
    expect(
      await service.registerEventCallBacks(callback, transaction)(),
    ).toBeFalsy();
    expect(afterCommitCalled).toEqual(true);
    expect(callbackCalled).toEqual(true);
  });

  it('should execute transaction callback if transaction if provided', async () => {
    let callbackCalled = false;
    const callback: any = () => {
      callbackCalled = true;
      return true;
    };

    expect(await service.registerEventCallBacks(callback)()).toEqual(true);
    expect(callbackCalled).toEqual(true);
  });
});
