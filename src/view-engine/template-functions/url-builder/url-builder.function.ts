import { Injectable, Scope } from '@nestjs/common';
import { ExtendFunction } from '../extend-function';
import { TemplateRegister } from '../template-function-registration';
import { UrlBuilderService } from '../../../url-management/services/url-builder/url-builder.service';

@TemplateRegister()
@Injectable({ scope: Scope.TRANSIENT })
export class UrlBuilderFunction implements ExtendFunction<string> {
  constructor(protected readonly urlBuilder: UrlBuilderService) {}

  functionName(): string {
    return 'url';
  }

  handler(
    path: string,
    options: {
      pathParameters?: { [key: string]: string | number };
      queryParameters?: { [key: string]: string | number };
    },
  ): string {
    return this.urlBuilder.url(path, options);
  }
}
