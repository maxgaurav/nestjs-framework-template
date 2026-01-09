import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemConfig } from '../../../environment/environment-types.interface';

@Injectable()
export class UrlBuilderService {
  constructor(protected readonly configService: ConfigService) {}

  /**
   * Generates url from path and query replacements
   * @param baseUrl
   * @param options
   */
  public url(
    baseUrl: string,
    options: {
      pathParameters?: {
        [key: string]: string | number;
      };
      queryParameters?: {
        [key: string]: string | number | string[] | number[];
      };
    } = {},
  ): string {
    options.pathParameters = options.pathParameters || {};
    options.queryParameters = options.queryParameters || {};

    const replacedPathParameters = this.getReplacedPathParameters(
      options.pathParameters,
      baseUrl,
    );

    const url = new URL(
      replacedPathParameters,
      this.configService.getOrThrow<SystemConfig>('system').url,
    );

    this.appendQueryParams(options.queryParameters, url);

    return url.toString();
  }

  /**
   * Appends query params to url
   * @param queryParams
   * @param url
   */
  public appendQueryParams(
    queryParams: {
      [p: string]: string | number | string[] | number[] | null | undefined;
    },
    url: URL,
  ) {
    Object.entries(queryParams)
      .reduce<[string, string | number][]>(
        (queryValues, [queryKey, queryValue]) => {
          if (Array.isArray(queryValue)) {
            queryValues.push(
              ...queryValue.map((value) => {
                return [queryKey, value] as never;
              }),
            );

            return queryValues;
          }

          queryValues.push([queryKey, queryValue as never]);
          return queryValues;
        },
        [],
      )
      .forEach(([queryKey, queryValue]) =>
        url.searchParams.append(queryKey, queryValue?.toString() ?? ''),
      );
  }

  /**
   * Returns replaced url value with path parameters
   * @param pathParams
   * @param baseUrl
   */
  public getReplacedPathParameters(
    pathParams: { [p: string]: string | number },
    baseUrl: string,
  ) {
    return Object.entries(pathParams).reduce<string>(
      (replacedString, [key, value]) =>
        replacedString.replace(`:${key}`, value.toString()),
      baseUrl,
    );
  }
}
