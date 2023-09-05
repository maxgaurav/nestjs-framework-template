import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemConfig } from '../../../environment/interfaces/environment-types.interface';

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

    const replacedPathParameters = Object.entries(
      options.pathParameters,
    ).reduce<string>(
      (replacedString, [key, value]) =>
        replacedString.replace(key, value.toString()),
      baseUrl,
    );

    const url = new URL(
      replacedPathParameters,
      this.configService.get<SystemConfig>('system').url,
    );

    Object.entries(options.queryParameters)
      .reduce<[string, string | number][]>(
        (queryValues, [queryKey, queryValue]) => {
          Array.isArray(queryValue)
            ? queryValues.push(
                ...(queryValue.map((value) => {
                  return [queryKey, value];
                }) as [string, string | number][]),
              )
            : queryValues.push([queryKey, queryValue]);
          return queryValues;
        },
        [],
      )
      .forEach(([queryKey, queryValue]) =>
        url.searchParams.append(queryKey, queryValue.toString()),
      );

    return url.toString();
  }
}
