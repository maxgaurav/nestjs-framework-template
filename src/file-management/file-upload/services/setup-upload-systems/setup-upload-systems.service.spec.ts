import { Test, TestingModule } from '@nestjs/testing';
import { SetupUploadSystemsService } from './setup-upload-systems.service';

describe('SetupUploadSystemsService', () => {
  let service: SetupUploadSystemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetupUploadSystemsService],
    }).compile();

    service = module.get<SetupUploadSystemsService>(SetupUploadSystemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
