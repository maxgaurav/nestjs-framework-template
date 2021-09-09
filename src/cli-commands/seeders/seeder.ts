export abstract class Seeder {
  /**
   * Main seed action
   */
  public abstract seed(): Promise<boolean>;

  [key: string]: any;
}

export interface SeederConstruct {
  new (...args: any): Seeder;
}
