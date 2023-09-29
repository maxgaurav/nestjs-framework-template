import { PathParamFunction } from './path-param.function';
import { ClsModule } from 'nestjs-cls';
import { Test, TestingModule } from '@nestjs/testing';

describe('PathParamFunction', () => {
  let service: PathParamFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClsModule.forRoot()],
      providers: [PathParamFunction],
    }).compile();

    service = await module.resolve(PathParamFunction);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
