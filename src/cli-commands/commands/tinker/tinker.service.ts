import { INestApplication, Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { getModelToken } from '@nestjs/sequelize';
import { createRepl, REGISTER_INSTANCE } from 'ts-node';

// eslint-disable-next-line @typescript-eslint/no-namespace,@typescript-eslint/no-unused-vars
declare namespace NodeJS {
  interface Global {
    tinkerContext: {
      app: INestApplication;
      getModelToken;
    };
  }
}

@Injectable()
export class TinkerService {
  /**
   * Application context (instance)
   * @protected
   */
  protected applicationContext: INestApplication;

  /**
   * Sets the main application that the tinker will run on
   * @param context
   */
  public setContext(context: INestApplication) {
    this.applicationContext = context;
  }

  @Command({
    command: 'tinker',
    describe: 'Start a tinker session with application context.',
  })
  public tinker() {
    global.tinkerContext = { app: this.applicationContext, getModelToken };
    createRepl({ service: process[REGISTER_INSTANCE] }).start();
  }
}
