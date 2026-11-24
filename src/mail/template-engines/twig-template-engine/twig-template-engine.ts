import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailTemplateEngine } from '@nestjs/mail';
import { join } from 'node:path';
import Twig from 'twig';
import { VIEW_RENDER_ENGINE } from '../../../view-engine/constants.js';
import { ViewConfig } from '../../../environment/environment-types.interface.js';

/**
 * Renders mail templates with the app's Twig engine, so mails share the views folder,
 * template functions (`url()`, ...) and partials with the web pages. Template names are
 * relative to the views folder without the extension, e.g. `emails/welcome`.
 */
@Injectable()
export class TwigTemplateEngine extends MailTemplateEngine {
  constructor(
    @Inject(VIEW_RENDER_ENGINE) private readonly twig: typeof Twig,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  render(name: string, context: object): Promise<string> {
    const { viewPath } = this.configService.getOrThrow<ViewConfig>('view');
    return new Promise<string>((resolve, reject) => {
      this.twig.renderFile(
        join(viewPath, `${name}.twig`),
        context as Twig.RenderOptions,
        (error: Error | null, html: string) =>
          error ? reject(error) : resolve(html),
      );
    });
  }
}
