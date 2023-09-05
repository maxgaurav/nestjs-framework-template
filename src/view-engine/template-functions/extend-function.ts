export interface ExtendFunction<T = any> {
  functionName(): string;

  handler(...args: any[]): T;
}

export interface ExtendFunctionConstructor {
  new (...args: any): ExtendFunction;
}
