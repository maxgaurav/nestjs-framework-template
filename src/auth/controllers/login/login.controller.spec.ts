import { Test, TestingModule } from '@nestjs/testing';
import { LoginController } from './login.controller';

describe('LoginController', () => {
  let controller: LoginController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
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
