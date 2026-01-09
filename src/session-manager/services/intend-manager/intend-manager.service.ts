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
      JSON.parse(
        intendFlashContent[intendFlashContent.length - 1],
      ) as IntendContent,
    );
  }

  /**
   * Returns complete intend content
   * @param request
   */
  public getIntend(request: Request): IntendContent {
    let intendContent: IntendContent;
    try {
      intendContent = JSON.parse(
        request.flash(this.intendFlashKey())[0],
      ) as IntendContent;
    } catch {
      // if for any case the get action fails the intend action should be re initialized
      // also sine a flash action to get value has been created the value will auto result in blank
      this.setupIntend(request);
      intendContent = JSON.parse(
        request.flash(this.intendFlashKey())[0],
      ) as IntendContent;
    }

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
