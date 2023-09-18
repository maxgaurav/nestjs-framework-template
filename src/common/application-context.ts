import { INestApplication } from '@nestjs/common';

export let applicationContext: INestApplication | null = null;

export function registerApplicationContext(application: INestApplication) {
  applicationContext = application;
}
