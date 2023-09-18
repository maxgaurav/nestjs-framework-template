export interface RedirectRouteExecutorInterface {
  generateUrl(request: any, response: any): Promise<string> | string;
}
