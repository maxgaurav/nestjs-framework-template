import { Global, Module } from '@nestjs/common';
import { OverwritePaginateService } from './services/overwrite-paginate.service.js';
import { PAGINATE_OPTIONS } from 'nestjs-sequelize-paginate/dist/lib/paginate.constans.js';
import { PaginateService } from 'nestjs-sequelize-paginate';

@Global()
@Module({
  imports: [],
  providers: [
    OverwritePaginateService,
    {
      provide: PAGINATE_OPTIONS,
      useValue: {},
    },
    {
      provide: PaginateService,
      useClass: OverwritePaginateService,
    },
  ],
  exports: [
    OverwritePaginateService,
    {
      provide: PAGINATE_OPTIONS,
      useValue: {},
    },
    {
      provide: PaginateService,
      useClass: OverwritePaginateService,
    },
  ],
})
export class PaginateOverwriteModule {}
