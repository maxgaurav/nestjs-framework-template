import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository.js';
import { UserModel } from '../../databases/models/user.model.js';
import { getModelToken } from '@nestjs/sequelize';

const FakedEmail = 'email@email.com';
describe('UserRepository', () => {
  let service: UserRepository;

  const model: typeof UserModel = {
    findOne: (value: any) => value,
    findByPk: (value: any) => value,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getModelToken(UserModel),
          useValue: model,
        },
      ],
    }).compile();

    service = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user model by email when found', async () => {
    const userModel: UserModel = { id: 1, email: FakedEmail } as any;
    const findOneSpy = vi
      .spyOn(model, 'findOne')
      .mockReturnValueOnce(Promise.resolve(userModel));

    const transaction = undefined;

    expect(await service.findByEmail(userModel.email, transaction)).toEqual(
      userModel,
    );

    expect(findOneSpy).toHaveBeenCalledWith({
      where: { email: userModel.email },
      transaction,
    });
  });

  it('should return null when find by email fails to find user', async () => {
    const userModel: UserModel = { id: 1, email: FakedEmail } as any;
    const findOneSpy = vi
      .spyOn(model, 'findOne')
      .mockReturnValueOnce(Promise.resolve(null));

    const transaction = undefined;

    expect(await service.findByEmail(userModel.email, transaction)).toEqual(
      null,
    );

    expect(findOneSpy).toHaveBeenCalledWith({
      where: { email: userModel.email },
      transaction,
    });
  });

  it('should find the user by id', async () => {
    const userModel: UserModel = { id: 1, email: FakedEmail } as any;
    const findSpy = vi
      .spyOn(model, 'findByPk')
      .mockReturnValueOnce(Promise.resolve(userModel));

    const transaction = undefined;

    expect(await service.findOrFail(userModel.id, transaction)).toEqual(
      userModel,
    );

    expect(findSpy).toHaveBeenCalledWith(userModel.id, {
      transaction,
      rejectOnEmpty: true,
    });
  });

  it('should return user when find by email results in user', async () => {
    const userModel: UserModel = { id: 1, email: FakedEmail } as any;

    const transaction = undefined;

    const findSpy = vi
      .spyOn(model, 'findOne')
      .mockReturnValueOnce(Promise.resolve(userModel));

    expect(
      await service.findByEmailOrFail(userModel.email, transaction),
    ).toEqual(userModel);

    expect(findSpy).toHaveBeenCalledWith({
      where: { email: userModel.email },
      transaction,
      rejectOnEmpty: true,
    });
  });
});
