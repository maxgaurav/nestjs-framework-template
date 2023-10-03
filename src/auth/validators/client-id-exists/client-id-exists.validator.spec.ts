import { ClientIdExistsValidator } from './client-id-exists.validator';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';
import { Test, TestingModule } from '@nestjs/testing';
import { GrantTypes } from '../../grant-types/grant-type-implementation';

describe('ClientIdExistsValidator', () => {
  let service: ClientIdExistsValidator;

  const clientRepo: ClientRepoService = {
    find: (value: any) => Promise.resolve(value),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientIdExistsValidator,
        {
          provide: ClientRepoService,
          useValue: clientRepo,
        },
      ],
    }).compile();

    service = await module.resolve<ClientIdExistsValidator>(
      ClientIdExistsValidator,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct validation message', () =>
    expect(service.message()).toEqual('The client id is not valid'));

  const emptyValues = [
    { value: null, type: 'null' },
    { value: undefined, type: 'undefined' },
    { value: '', type: 'empty' },
  ];

  test.each(emptyValues)(
    'should return true for $type value',
    async ({ value }) =>
      expect(await service.check(value, {} as any)).toEqual(true),
  );

  test.each([
    { value: ['123', { object: { grant_type: '' } }], type: 'empty' },
    { value: ['123', { object: { grant_type: null } }], type: 'null' },

    {
      value: ['123', { object: { grant_type: undefined } }],
      type: 'undefined',
    },
  ])('should return true if grant type value is $type', async ({ value }) => {
    const [value1, value2] = value;
    expect(await service.check(value1 as any, value2 as any)).toEqual(true);
  });

  test.each([
    {
      value: [null, { object: { grant_type: GrantTypes.AuthorizationCode } }],
      type: 'result is null',
    },
    {
      value: [
        { is_revoked: false, grant_type: GrantTypes.PKCE },
        { object: { grant_type: GrantTypes.AuthorizationCode } },
      ],
      type: 'result exists but with grant type mismatch',
    },
    {
      value: [
        { is_revoked: true, grant_type: GrantTypes.AuthorizationCode },
        { object: { grant_type: GrantTypes.AuthorizationCode } },
      ],
      type: 'result exists but is revoked',
    },
    {
      value: [
        { is_revoked: true, grant_type: GrantTypes.PKCE },
        { object: { grant_type: GrantTypes.AuthorizationCode } },
      ],
      type: 'result exists but is revoked and grant type mismatch',
    },
  ])(
    `should return false for failed conditions when $type`,
    async ({ value }) => {
      const [findResult, grantType] = value;
      const findSpy = jest
        .spyOn(clientRepo, 'find')
        .mockReturnValue(Promise.resolve(findResult as any));

      expect(await service.check('123', grantType as any)).toEqual(false);
      expect(findSpy).toHaveBeenCalledWith('123');
    },
  );

  it('should return true when client repo exists and is not revoked and grant type matches', async () => {
    const findSpy = jest.spyOn(clientRepo, 'find').mockReturnValue(
      Promise.resolve({
        grant_type: GrantTypes.AuthorizationCode,
        is_revoked: false,
      } as any),
    );

    expect(
      await service.check('123', {
        object: { grant_type: GrantTypes.AuthorizationCode },
      } as any),
    ).toEqual(true);

    expect(findSpy).toHaveBeenCalledWith('123');
  });
});
