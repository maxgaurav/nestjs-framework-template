export interface RedirectRouteExecutorInterface {
  generateUrl(response: any): Promise<string> | string;
}
