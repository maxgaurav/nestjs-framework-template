import { Reflector } from '@nestjs/core';

export const ResourceMap = Reflector.createDecorator<{
  new (...args: any[]): any;
}>();
