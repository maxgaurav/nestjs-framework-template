import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

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
