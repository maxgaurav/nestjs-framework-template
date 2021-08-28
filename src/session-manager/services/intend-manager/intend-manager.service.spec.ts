import { Test, TestingModule } from '@nestjs/testing';
import { IntendManagerService } from './intend-manager.service';
import { SESSION_FLASH_INTENDS_KEY } from '../../constants';

describe('IntendManagerService', () => {
  let service: IntendManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntendManagerService],
    }).compile();

    service = module.get<IntendManagerService>(IntendManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return default value', () => {
    expect(service.getDefaultValue()).toEqual(
      expect.objectContaining({ url: null }),
    );
  });

  it('should return correct flash key', () => {
    expect(service.intendFlashKey()).toEqual(SESSION_FLASH_INTENDS_KEY);
  });

  it('should update intend content in request session', () => {
    const request = { flash: (value) => value };
    const flashSpy = jest.spyOn(request, 'flash');
    service.updateContent(request as any, service.getDefaultValue());
    expect(flashSpy).toHaveBeenCalledWith(
      service.intendFlashKey(),
      JSON.stringify(service.getDefaultValue()),
    );
  });

  it('should return current intend content', () => {
    const request = { flash: (value) => value };
    const flashSpy = jest
      .spyOn(request, 'flash')
      .mockReturnValueOnce([JSON.stringify(service.getDefaultValue())]);

    expect(service.getIntend(request as any)).toEqual(
      service.getDefaultValue(),
    );
    expect(flashSpy).toHaveBeenCalledTimes(2);
    expect(flashSpy).toHaveBeenNthCalledWith(1, service.intendFlashKey());
    expect(flashSpy).toHaveBeenNthCalledWith(
      2,
      service.intendFlashKey(),
      JSON.stringify(service.getDefaultValue()),
    );
  });

  it('should setup initial stage of intend when no intend value is set', () => {
    const request = { flash: (value) => value };
    const updateSpy = jest.spyOn(service, 'updateContent').mockImplementation();
    const flashSpy = jest.spyOn(request, 'flash').mockReturnValueOnce([]);
    service.setupIntend(request as any);
    expect(flashSpy).toHaveBeenCalledWith(service.intendFlashKey());
    expect(updateSpy).toHaveBeenCalledWith(request, service.getDefaultValue());
    updateSpy.mockClear();
  });

  it('should skip initialization if request is already setup with intend content', () => {
    const request = { flash: (value) => value };
    const updateSpy = jest.spyOn(service, 'updateContent');
    const flashValue = service.getDefaultValue();
    flashValue.url = 'changed';
    const flashSpy = jest
      .spyOn(request, 'flash')
      .mockReturnValueOnce([JSON.stringify(flashValue)]);
    service.setupIntend(request as any);
    expect(flashSpy).toHaveBeenCalledWith(service.intendFlashKey());
    expect(updateSpy).toHaveBeenCalledWith(request, flashValue);
    updateSpy.mockClear();
  });

  it('should set url in intend', () => {
    const getIntendSpy = jest
      .spyOn(service, 'getIntend')
      .mockReturnValueOnce(service.getDefaultValue());
    const updateIntendSpy = jest
      .spyOn(service, 'updateContent')
      .mockImplementation();
    const request = {};
    service.setUrl(request as any, 'testUrl');
    expect(getIntendSpy).toHaveBeenCalled();
    const defaultValue = service.getDefaultValue();
    defaultValue.url = 'testUrl';
    expect(updateIntendSpy).toHaveBeenCalledWith(request, defaultValue);

    getIntendSpy.mockClear();
    updateIntendSpy.mockClear();
  });

  it('should get url in intend', () => {
    const getIntendSpy = jest
      .spyOn(service, 'getIntend')
      .mockReturnValueOnce({ url: 'test' });
    const request = {};

    expect(service.getUrl(request as any)).toEqual('test');
    expect(getIntendSpy).toHaveBeenCalled();

    getIntendSpy.mockClear();
  });

  it('should return null when intend is empty', () => {
    const getIntendSpy = jest
      .spyOn(service, 'getIntend')
      .mockReturnValueOnce(null);
    const request = {} as any;
    expect(service.getUrl(request)).toEqual(null);
    expect(getIntendSpy).toHaveBeenCalledWith(request);
  });

  it('should call setup intend if get action fails for some reason', () => {
    let isFailCalled = false;
    const request = { flash: (value) => value };
    const flashSpy = jest.spyOn(request, 'flash').mockImplementation(() => {
      if (!isFailCalled) {
        isFailCalled = true;
        return ['should fail'];
      }

      return [JSON.stringify(service.getDefaultValue())];
    });

    const updateSpy = jest.spyOn(service, 'updateContent').mockImplementation();
    const setupIntend = jest.spyOn(service, 'setupIntend').mockImplementation();

    expect(service.getIntend(request as any)).toEqual(
      service.getDefaultValue(),
    );
    expect(flashSpy).toHaveBeenCalledTimes(2);
    expect(setupIntend).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
  });
});
