import { Test, TestingModule } from '@nestjs/testing';
import { ClientRepoService } from './client-repo.service';
import { RandomByteGeneratorService } from '../../../../common/services/random-byte-generator/random-byte-generator.service';
import { ClientModel } from '../../../../databases/models/oauth/client.model';
import { getModelToken } from '@nestjs/sequelize';

describe('ClientRepoService', () => {
  let service: ClientRepoService;

  const randomByeGenerator: RandomByteGeneratorService = {
    generateRandomByte: (value) => value,
  } as any;
  const model: typeof ClientModel = {
    findByPk: (value) => value,
    build: (value) => value,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientRepoService,
        {
          provide: RandomByteGeneratorService,
          useValue: randomByeGenerator,
        },
        {
          provide: getModelToken(ClientModel),
          useValue: model,
        },
      ],
    }).compile();

    service = module.get<ClientRepoService>(ClientRepoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find or fail', async () => {
    const client: ClientModel = { id: 'test' } as any;
    const transaction = null;
    const findSpy = jest
      .spyOn(model, 'findByPk')
      .mockReturnValue(Promise.resolve(client));
    expect(await service.findOrFail('test', transaction)).toEqual(client);
    expect(findSpy).toHaveBeenCalledWith('test', {
      rejectOnEmpty: true,
      transaction,
    });
  });

  it('should create new oauth client', async () => {
    const client: ClientModel = {
      id: 'test',
      setAttributes: (value) => value,
      save: (value) => value,
    } as any;

    const transaction = null;

    const buildSpy = jest.spyOn(model, 'build').mockReturnValue(client);
    const setAttributeSpy = jest
      .spyOn(client, 'setAttributes')
      .mockReturnValue(client);
    const saveSpy = jest
      .spyOn(client, 'save')
      .mockReturnValue(Promise.resolve(client));

    const sample = 'sample';
    const generateSpy = jest
      .spyOn(randomByeGenerator, 'generateRandomByte')
      .mockReturnValue(Buffer.from(sample));
    expect(await service.create('test', transaction)).toEqual(client);
    expect(buildSpy).toHaveBeenCalled();
    expect(setAttributeSpy).toHaveBeenCalledWith({
      name: 'test',
      secret: Buffer.from(sample).toString('hex'),
    });
    expect(generateSpy).toHaveBeenCalledWith(40);
    expect(saveSpy).toHaveBeenCalledWith({ transaction });
  });

  it('should revoke client', async () => {
    const client: ClientModel = {
      id: 'test',
      setAttributes: (value) => value,
      save: (value) => value,
    } as any;

    const setAttributeSpy = jest
      .spyOn(client, 'setAttributes')
      .mockReturnValue(client);
    const saveSpy = jest
      .spyOn(client, 'save')
      .mockReturnValue(Promise.resolve(client));
    const transaction = null;

    expect(await service.revoke(client, transaction)).toEqual(client);
    expect(setAttributeSpy).toHaveBeenCalledWith({ is_revoked: false });
    expect(saveSpy).toHaveBeenCalledWith({ transaction });
  });
});
