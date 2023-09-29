import { SessionFunction } from './session.function';
import { ClsModule } from 'nestjs-cls';
import { Test, TestingModule } from '@nestjs/testing';

describe('SessionFunction', () => {
  let service: SessionFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClsModule.forRoot()],
      providers: [SessionFunction],
    }).compile();

    service = await module.resolve(SessionFunction);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
