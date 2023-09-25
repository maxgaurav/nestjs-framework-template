import { Test, TestingModule } from '@nestjs/testing';
import { UrlBuilderService } from './url-builder.service';
import { ConfigService } from '@nestjs/config';

describe('UrlBuilderService', () => {
  let service: UrlBuilderService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [UrlBuilderService, ConfigService],
    }).compile();

    service = module.get<UrlBuilderService>(UrlBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct url without path and query params', () => {
    const config = module.get(ConfigService);

    const getSpy = jest.spyOn(config, 'get').mockReturnValue({
      url: 'http://localhost',
    });

    expect(service.url('')).toEqual('http://localhost/');
    expect(getSpy).toHaveBeenCalledWith('system');
  });

  it('should return correct url with path and query params', () => {
    const config = module.get(ConfigService);

    const getSpy = jest.spyOn(config, 'get').mockReturnValue({
      url: 'http://localhost',
    });

    expect(
      service.url('', { queryParameters: {}, pathParameters: {} }),
    ).toEqual('http://localhost/');
    expect(getSpy).toHaveBeenCalledWith('system');
  });

  it('should append all types of query params', () => {
    const url = new URL('http://sample.com');

    const queryParam = {
      string: 'string',
      number: 1,
      stringArray: ['string1', 'string2'],
      numberArray: [1, 2],
    };

    service.appendQueryParams(queryParam, url);

    expect(url.searchParams.get('string')).toEqual('string');
    expect(url.searchParams.get('number')).toEqual('1');
    expect(url.searchParams.getAll('stringArray').sort()).toEqual(
      queryParam.stringArray.sort(),
    );
    expect(url.searchParams.getAll('numberArray').sort()).toEqual(
      queryParam.numberArray.map((number) => number.toString()).sort(),
    );
  });

  it('should return new url with replaced path parameters', () => {
    const params = {
      toReplace: 'someValue',
    };
    const baseUrl = 'some/part/:toReplace/url';

    expect(service.getReplacedPathParameters(params, baseUrl)).toEqual(
      'some/part/someValue/url',
    );
  });
});
