import { vi } from 'vitest';
import { ClientIdExistsValidator } from './client-id-exists.validator.js';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { GrantTypes } from '../../grant-types/grant-type-implementation.js';

const VALID_ID = '7d5f4c2a-1b3e-4f6a-9c8d-0e1f2a3b4c5d';

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
    expect(service.defaultMessage()).toEqual('The client id is not valid'));

  const emptyValues = [
    { value: null, type: 'null' },
    { value: undefined, type: 'undefined' },
    { value: '', type: 'empty' },
  ];

  test.each(emptyValues)(
    'should return true for $type value',
    async ({ value }) =>
      expect(await service.validate(value, {} as any)).toEqual(true),
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
    expect(await service.validate(value1 as any, value2 as any)).toEqual(true);
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
      const findSpy = vi
        .spyOn(clientRepo, 'find')
        .mockReturnValue(Promise.resolve(findResult as any));

      expect(await service.validate(VALID_ID, grantType as any)).toEqual(false);
      expect(findSpy).toHaveBeenCalledWith(VALID_ID);
    },
  );

  it('should return true when client repo exists and is not revoked and grant type matches', async () => {
    const findSpy = vi.spyOn(clientRepo, 'find').mockReturnValue(
      Promise.resolve({
        grant_type: GrantTypes.AuthorizationCode,
        is_revoked: false,
      } as any),
    );

    expect(
      await service.validate(VALID_ID, {
        object: { grant_type: GrantTypes.AuthorizationCode },
      } as any),
    ).toEqual(true);

    expect(findSpy).toHaveBeenCalledWith(VALID_ID);
  });

  // Regression: a non-UUID reached the database lookup and failed the request with a 500
  it('skips the lookup for a malformed id (left to @IsUUID)', async () => {
    const findSpy = vi.spyOn(clientRepo, 'find');

    expect(
      await service.validate('not-a-uuid', {
        object: { grant_type: GrantTypes.AuthorizationCode },
      } as any),
    ).toEqual(true);
    expect(findSpy).not.toHaveBeenCalled();
  });
});
