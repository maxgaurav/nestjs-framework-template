import { QueryFunction } from './query.function';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsModule } from 'nestjs-cls';

describe('QueryFunction', () => {
  let service: QueryFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClsModule.forRoot()],
      providers: [QueryFunction],
    }).compile();

    service = await module.resolve(QueryFunction);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
