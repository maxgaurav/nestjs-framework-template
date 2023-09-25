import { Test, TestingModule } from '@nestjs/testing';
import { UrlBuilderFunction } from './url-builder.function';
import { ConfigService } from '@nestjs/config';
import { UrlBuilderService } from '../../../url-management/services/url-builder/url-builder.service';

describe('UrlBuilderFunction', () => {
  let service: UrlBuilderFunction;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        UrlBuilderFunction,
        UrlBuilderService,
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = await module.resolve<UrlBuilderFunction>(UrlBuilderFunction);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct handler name', () => {
    expect(service.functionName()).toEqual('url');
  });

  it('should create url using url builder service', () => {
    const builderService = module.get(UrlBuilderService);
    const urlFunctionSpy = jest
      .spyOn(builderService, 'url')
      .mockReturnValue('http://sample.com/url');

    const queryParameters = { query: 'string' };
    const pathParameters = { path: 'string' };

    expect(
      service.handler('path', {
        queryParameters,
        pathParameters,
      }),
    ).toEqual('http://sample.com/url');

    expect(urlFunctionSpy).toHaveBeenCalledWith('path', {
      pathParameters,
      queryParameters,
    });
  });
});
