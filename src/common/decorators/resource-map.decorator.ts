import { SetMetadata } from '@nestjs/common';

export const RESOURCE_MAP_KEY = 'resource-map.decorator';

export const ResourceMap = (resourceType: { new (...args: any[]): any }) =>
  SetMetadata(RESOURCE_MAP_KEY, resourceType);
