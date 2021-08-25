import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { SESSION_FLASH_INTENDS_KEY } from '../../constants';

export interface IntendContent {
  url: string | null;
}

@Injectable()
export class IntendManagerService {
  private defaultIntend: IntendContent = {
    url: null,
  };

  public getDefaultValue(): IntendContent {
    return this.defaultIntend;
  }

  /**
   * Returns the key against which flash is being set
   */
  public intendFlashKey(): string {
    return SESSION_FLASH_INTENDS_KEY;
  }

  /**
   * Setup initial state of intend content
   * @param request
   */
  public setupIntend(request: Request): void {
    const intendFlashContent = request.flash(this.intendFlashKey());
    if (intendFlashContent.length === 0) {
      this.updateContent(request, this.getDefaultValue());
      return;
    }

    this.updateContent(
      request,
      JSON.parse(intendFlashContent[intendFlashContent.length - 1]),
    );
  }

  /**
   * Returns complete intend content
   * @param request
   */
  public getIntend(request: Request): IntendContent {
    const intendContent: IntendContent = JSON.parse(
      request.flash(this.intendFlashKey())[0],
    );

    this.updateContent(request, intendContent);

    return intendContent;
  }

  /**
   * Updates the intend content
   * @param request
   * @param content
   * @protected
   */
  public updateContent(request: Request, content: IntendContent): void {
    request.flash(this.intendFlashKey(), JSON.stringify(content));
  }

  /**
   * Sets the url for intend
   * @param request
   * @param url
   */
  public setUrl(request: Request, url: string | null): void {
    const intendContent = this.getIntend(request);
    intendContent.url = url;
    this.updateContent(request, intendContent);
  }

  /**
   * Returns the url set for intend
   * @param request
   */
  public getUrl(request: Request): string | null {
    const intend = this.getIntend(request);
    return intend?.url || null;
  }
}
