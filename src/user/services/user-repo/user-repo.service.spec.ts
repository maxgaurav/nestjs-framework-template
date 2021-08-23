import { Test, TestingModule } from '@nestjs/testing';
import { UserRepoService } from './user-repo.service';
import { UserModel } from '../../../databases/models/user.model';
import { getModelToken } from '@nestjs/sequelize';
import { EmptyResultError } from 'sequelize';

describe('UserRepoService', () => {
  let service: UserRepoService;

  const model: typeof UserModel = {
    findOne: (value) => value,
    findByPk: (value) => value,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepoService,
        {
          provide: getModelToken(UserModel),
          useValue: model,
        },
      ],
    }).compile();

    service = module.get<UserRepoService>(UserRepoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user model by email when found', async () => {
    const userModel: UserModel = { id: 1, email: 'email@email.com' } as any;
    const findOneSpy = jest
      .spyOn(model, 'findOne')
      .mockReturnValueOnce(Promise.resolve(userModel));

    const transaction = null;

    expect(await service.findByEmail(userModel.email, transaction)).toEqual(
      userModel,
    );

    expect(findOneSpy).toHaveBeenCalledWith({
      where: { email: userModel.email },
      transaction,
    });
  });

  it('should return null when find by email fails to find user', async () => {
    const userModel: UserModel = { id: 1, email: 'email@email.com' } as any;
    const findOneSpy = jest
      .spyOn(model, 'findOne')
      .mockReturnValueOnce(Promise.resolve(undefined));

    const transaction = null;

    expect(await service.findByEmail(userModel.email, transaction)).toEqual(
      null,
    );

    expect(findOneSpy).toHaveBeenCalledWith({
      where: { email: userModel.email },
      transaction,
    });
  });

  it('should find the user by id', async () => {
    const userModel: UserModel = { id: 1, email: 'email@email.com' } as any;
    const findSpy = jest
      .spyOn(model, 'findByPk')
      .mockReturnValueOnce(Promise.resolve(userModel));

    const transaction = null;

    expect(await service.findOrFail(userModel.id, transaction)).toEqual(
      userModel,
    );

    expect(findSpy).toHaveBeenCalledWith(userModel.id, { transaction });
  });

  it('should return user when find by email results in user', async () => {
    const userModel: UserModel = { id: 1, email: 'email@email.com' } as any;
    const findByEmailSpy = jest
      .spyOn(service, 'findByEmail')
      .mockReturnValueOnce(Promise.resolve(userModel));

    const transaction = null;

    expect(
      await service.findByEmailOrFail(userModel.email, transaction),
    ).toEqual(userModel);

    expect(findByEmailSpy).toHaveBeenCalledWith(userModel.email, transaction);
  });

  it('should throw exception when find by email or fail does not return user', async () => {
    const userModel: UserModel = { id: 1, email: 'email@email.com' } as any;
    const findByEmailSpy = jest
      .spyOn(service, 'findByEmail')
      .mockReturnValueOnce(Promise.resolve(null));

    const transaction = null;
    let errorMapped = false;

    try {
      await service.findByEmailOrFail(userModel.email, transaction);
    } catch (err) {
      if (err instanceof EmptyResultError) {
        errorMapped = true;
      }
    }
    expect(errorMapped).toEqual(true);
    expect(findByEmailSpy).toHaveBeenCalledWith(userModel.email, transaction);
  });
});
