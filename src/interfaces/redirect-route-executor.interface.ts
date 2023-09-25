export interface RedirectRouteExecutorInterface {
  generateUrl(request: any, result: any): Promise<string> | string;
}

export interface RedirectRouteExecutorInterfaceInst {
  new (...args: any[]): RedirectRouteExecutorInterface;
}
