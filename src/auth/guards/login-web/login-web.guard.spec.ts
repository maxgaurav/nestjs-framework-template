import { Test, TestingModule } from '@nestjs/testing';
import { LoginWebGuard } from './login-web.guard';
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

describe('LoginWebGuard', () => {
  let service: LoginWebGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoginWebGuard],
    }).compile();

    service = module.get<LoginWebGuard>(LoginWebGuard);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw unprocessable error when unauthorized exception is received', async () => {
    let errorThrown = false;

    try {
      service.handleRequest(
        new UnauthorizedException(),
        false,
        false,
        false,
        false,
      );
    } catch (err) {
      if (err instanceof UnprocessableEntityException) {
        errorThrown = true;
        expect((err.getResponse() as any).message).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              property: 'credentials',
              constraints: expect.objectContaining({
                credentials: 'Credentials are invalid',
              }),
            }),
          ]),
        );
      }
    }

    expect(errorThrown).toEqual(true);
  });

  it('should pass when there is no error and user is injected', async () => {
    const superActionSpy = jest
      .spyOn(AuthGuard('local').prototype, 'handleRequest')
      .mockReturnValueOnce(true);

    expect(await service.handleRequest(false, {}, false, false, false)).toEqual(
      true,
    );

    expect(superActionSpy).toHaveBeenCalledWith(false, {}, false, false, false);
  });
});
