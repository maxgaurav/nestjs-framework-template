import {
  BaseValidator,
  MappedValueType,
  ValidatorDecorator,
} from './base-validator';

class Validator extends BaseValidator<string> {
  constructor() {
    super();
    this.valueMap.set('pass', [{ value: 'testPass', state: true }]);
    this.valueMap.set('mixed', [
      { value: 'testPass', state: true },
      { value: 'testFail', state: false },
    ]);
    this.valueMap.set('fail', [{ value: 'testFail', state: false }]);
  }

  public getValueMap(): Map<string, MappedValueType<string>[]> {
    return this.valueMap;
  }

  check(): Promise<boolean> {
    return Promise.resolve(true);
  }

  message(value): string {
    return `The value is ${value}`;
  }
}

describe('BaseValidator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('should return correct message when standard message type and no map is set', () => {
    expect(
      validator.defaultMessage({
        value: 'test',
        constraints: [],
        object: {},
        property: '',
        targetName: '',
      }),
    ).toEqual('The value is test');
  });

  it('should return correct message when standard message type when map is set', () => {
    const contextSpy = jest
      .spyOn(validator, 'getContextId')
      .mockReturnValue('fail');
    expect(
      validator.defaultMessage({
        value: 'testFail',
        constraints: [],
        object: {},
        property: '',
        targetName: '',
      }),
    ).toEqual('The value is testFail');
    expect(contextSpy).toHaveBeenCalled();
  });

  it('should return array of json message for array', () => {
    const contextSpy = jest
      .spyOn(validator, 'getContextId')
      .mockReturnValue('mixed');
    expect(
      validator.defaultMessage({
        value: 'testFail',
        constraints: [{ each: true }],
        object: {},
        property: '',
        targetName: '',
      }),
    ).toEqual(JSON.stringify({ '1': 'The value is testFail' }));
    expect(contextSpy).toHaveBeenCalled();
  });

  it('should return false if validation options is not available', () => {
    expect(validator.isForArray()).toEqual(false);
  });

  it('should return false if validation options constraints value is empty', () => {
    expect(validator.isForArray({ constraints: [] })).toEqual(false);
  });

  it('should return false if constraint is set explicitly to false', () => {
    expect(validator.isForArray({ constraints: [{ each: false }] })).toEqual(
      false,
    );
  });

  it('should return true if constraint is set explicitly to true', () => {
    expect(validator.isForArray({ constraints: [{ each: true }] })).toEqual(
      true,
    );
  });

  it('should add value to value mapper', async () => {
    expect(
      await validator.validate(true, {
        property: '',
        targetName: '',
        value: true,
        constraints: [],
        object: { __CONTEXT: { id: 'newValue' } },
      }),
    ).toEqual(true);
    expect(validator.getValueMap().has('newValue')).toEqual(true);
    expect(validator.getValueMap().get('newValue')).toEqual([
      {
        value: true,
        state: true,
      },
    ]);
  });

  it('should skip adding context value when context id is not valid', async () => {
    expect(
      await validator.validate(true, {
        property: '',
        targetName: '',
        value: true,
        constraints: [],
        object: { __CONTEXT: { id: null } },
      }),
    ).toEqual(true);
    expect(validator.getValueMap().has('newValue')).toEqual(false);
  });

  it('should return decorator handling function', () => {
    expect(typeof ValidatorDecorator(Validator)).toEqual('function');
    expect(typeof ValidatorDecorator(Validator)()).toEqual('function');
    expect(typeof ValidatorDecorator(Validator, true)).toEqual('function');
    expect(typeof ValidatorDecorator(Validator, true)({})).toEqual('function');
  });
});
