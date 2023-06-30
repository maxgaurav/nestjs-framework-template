import { Test, TestingModule } from '@nestjs/testing';
import { OverwritePaginateService } from './overwrite-paginate.service';
import { PAGINATE_OPTIONS } from 'nestjs-sequelize-paginate/dist/lib/paginate.constans';
import { Sequelize } from 'sequelize-typescript';

describe('OverwritePaginateService', () => {
  let service: OverwritePaginateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OverwritePaginateService,
        {
          provide: PAGINATE_OPTIONS,
          useValue: {},
        },
        {
          provide: Sequelize,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OverwritePaginateService>(OverwritePaginateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
