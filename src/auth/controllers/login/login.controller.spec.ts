import { Test, TestingModule } from '@nestjs/testing';
import { LoginController } from './login.controller';
import { AuthService } from '../../services/auth/auth.service';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { UserRepoService } from '../../../user/services/user-repo/user-repo.service';
import { IntendManagerService } from '../../../session-manager/services/intend-manager/intend-manager.service';
import { AccessTokenRepoService } from '../../services/oauth/access-token-repo/access-token-repo.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenRepoService } from '../../services/oauth/refresh-token-repo/refresh-token-repo.service';

const DefaultRedirectUrl = '/intendUrl';
describe('LoginController', () => {
  let controller: LoginController;
  let module: TestingModule;

  const intendManager: IntendManagerService = {
    getUrl: (value) => value,
    setUrl: (value) => value,
  } as any;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        AuthService,
        {
          provide: RefreshTokenRepoService,
          useValue: {},
        },
        { provide: HashEncryptService, useValue: {} },
        {
          provide: UserRepoService,
          useValue: {},
        },
        {
          provide: IntendManagerService,
          useValue: intendManager,
        },
        {
          provide: AccessTokenRepoService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<LoginController>(LoginController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should set the session property with auth information and redirect to correct url', async () => {
    const request: any = {
      session: {
        save: (value) => value,
      },
      user: { id: 1 },
    };

    const response: any = { redirect: (value) => value };

    const saveSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: () => void) => {
        callback();
      });

    const redirectSpy = jest.spyOn(response, 'redirect');
    const getSpy = jest
      .spyOn(intendManager, 'getUrl')
      .mockReturnValueOnce(null);

    await controller.login(request, response);
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
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(redirectSpy).toHaveBeenCalledWith(
      LoginController.DefaultRedirectUrl,
    );
    expect(getSpy).toHaveBeenCalledWith(request);
  });

  it('should set the session property with auth information and redirect to intend url', async () => {
    const request: any = {
      session: {
        save: (value) => value,
      },
      user: { id: 1 },
    };

    const response: any = { redirect: (value) => value };

    const saveSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: () => void) => {
        callback();
      });

    const redirectSpy = jest.spyOn(response, 'redirect');
    const getSpy = jest
      .spyOn(intendManager, 'getUrl')
      .mockReturnValueOnce(DefaultRedirectUrl);

    const setSpy = jest.spyOn(intendManager, 'setUrl').mockImplementation();

    await controller.login(request, response);
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
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(redirectSpy).toHaveBeenCalledWith(DefaultRedirectUrl);
    expect(getSpy).toHaveBeenCalledWith(request);
    expect(setSpy).toHaveBeenCalledWith(request, null);
  });

  it('should set the session property with auth information and redirect to correct url', async () => {
    const request: any = {
      session: {
        save: (value) => value,
      },
      user: { id: 1 },
    };

    const response: any = { redirect: (value) => value };

    const saveSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: () => void) => {
        callback();
      });

    const redirectSpy = jest.spyOn(response, 'redirect');
    const getSpy = jest
      .spyOn(intendManager, 'getUrl')
      .mockReturnValueOnce(null);

    await controller.login(request, response);
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
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(redirectSpy).toHaveBeenCalledWith(
      LoginController.DefaultRedirectUrl,
    );
    expect(getSpy).toHaveBeenCalledWith(request);
  });

  it('should fail with rejection session save failed', async () => {
    const request: any = {
      session: {
        save: (value) => value,
      },
      user: { id: 1 },
    };

    const response: any = { redirect: (value) => value };

    let calledForSuccess = false;
    const successSpy = jest
      .spyOn(request.session, 'save')
      .mockImplementation((callback: (err?: string) => void) => {
        if (!calledForSuccess) {
          callback();
          calledForSuccess = true;
          return;
        }
        callback('shouldFail');
      });

    const redirectSpy = jest.spyOn(response, 'redirect');
    jest.spyOn(intendManager, 'getUrl').mockReturnValueOnce(DefaultRedirectUrl);

    jest.spyOn(intendManager, 'setUrl').mockImplementation();
    let errorThrown = false;
    try {
      await controller.login(request, response);
    } catch (err) {
      if (err === 'shouldFail') {
        errorThrown = true;
      }
    }

    expect(errorThrown).toEqual(true);
    expect(redirectSpy).not.toHaveBeenCalled();
    expect(successSpy).toHaveBeenCalled();
  });
});
