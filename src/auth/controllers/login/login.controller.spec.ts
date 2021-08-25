import { Test, TestingModule } from '@nestjs/testing';
import { LoginController } from './login.controller';
import { AuthService } from '../../services/auth/auth.service';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { UserRepoService } from '../../../user/services/user-repo/user-repo.service';

describe('LoginController', () => {
  let controller: LoginController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        AuthService,
        { provide: HashEncryptService, useValue: {} },
        {
          provide: UserRepoService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<LoginController>(LoginController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should set the session property with auth information', () => {
    const request: any = { session: {}, user: { id: 1 } };
    controller.login(request);
    expect(request).toEqual(
      expect.objectContaining({
        session: expect.objectContaining({
          auth: expect.objectContaining({
            isAuth: true,
            userId: request.user.id,
          }),
        }),
      }),
    );
  });
});
