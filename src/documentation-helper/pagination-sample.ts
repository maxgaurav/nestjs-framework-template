import type { SchemaObject } from '@nestjs/swagger';

export const paginationSample = (
  entity: string,
): SchemaObject & Partial<any> => ({
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        $ref: `#/components/schemas/${entity}`,
      },
    },
    meta: {
      type: 'object',
      properties: {
        current_page: {
          type: 'number',
        },
        from: {
          type: 'number',
        },
        last_page: {
          type: 'number',
        },
        per_page: {
          type: 'number',
        },
        to: {
          type: 'number',
        },
        total: {
          type: 'number',
        },
      },
    },
  },
});
