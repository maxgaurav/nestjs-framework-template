import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraintInterface,
} from 'class-validator';

export type MappedValueType<T = any> = { value: T; state: boolean };

type BaseValidatorConstructor = { new (...args: any[]): BaseValidator };

type DecoratorReturnType = (object: any, propertyName: string) => void;

export type DecoratorFunctionWithoutConfig = (
  validationOptions?: ValidationOptions,
) => DecoratorReturnType;

export type DecoratorFunctionWithConfig<T> = (
  config: T,
  validationOptions?: ValidationOptions,
) => DecoratorReturnType;

export abstract class BaseValidator<T = any>
  implements ValidatorConstraintInterface
{
  protected valueMap: Map<string, MappedValueType<T>[]> = new Map<
    string,
    MappedValueType<T>[]
  >();

  /**
   * Message builder
   * @param value
   * @param validationArguments
   */
  public abstract message(
    value: any,
    validationArguments?: ValidationArguments,
  ): string;

  /**
   * @inheritDoc
   * @param validationArguments
   */
  public defaultMessage(validationArguments?: ValidationArguments): string {
    const result = this.valueMap.get(this.getContextId(validationArguments));

    if (!result || !this.isForArray(validationArguments)) {
      return this.message(validationArguments.value, validationArguments);
    }

    const mappedErrors: { [key: string]: string } = {};

    result.forEach((value, index) => {
      if (!!value.state) {
        return;
      }

      mappedErrors[index.toString()] = this.message(
        value.value,
        validationArguments,
      );
    });

    this.valueMap.delete(this.getContextId(validationArguments));

    return JSON.stringify(mappedErrors);
  }

  /**
   * Returns true if its for array
   * @param validationArguments
   */
  public isForArray(
    validationArguments?: Partial<ValidationArguments>,
  ): boolean {
    if (validationArguments?.constraints instanceof Array) {
      const value: undefined | ValidationOptions =
        validationArguments.constraints[0];

      return !!value?.each;
    }
    return false;
  }

  /**
   * Returns true when task id is null  or undefined else when exists
   * @param value
   * @param validationArguments
   */
  public async validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    const result = await this.check(value, validationArguments);
    this.addValueState(value, result, this.getContextId(validationArguments));

    return result;
  }

  /**
   * Main check action. Returns true when valid else false
   * @param value
   * @param validationArguments
   */
  public abstract check(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean>;

  /**
   * Returns the context id mapped to validator
   * @param validationArguments
   */
  public getContextId(
    validationArguments: ValidationArguments | undefined,
  ): string | null {
    const value = (validationArguments?.object as any)?.__CONTEXT;
    return value?.id;
  }

  public getContextContent(validationArguments: ValidationArguments): {
    params: Record<string, any>;
    query: Record<string, string>;
    user: null | number;
    id: string;
  } {
    return (validationArguments?.object as any)?.__CONTEXT;
  }

  /**
   *
   * @param validatorArg
   */
  public constraintInfo<T = undefined>(
    validatorArg: ValidationArguments,
  ): T | undefined {
    const constraints = validatorArg.constraints;
    if (constraints.length !== 2) {
      return undefined;
    }

    return constraints[1];
  }

  /**
   * Adds value to state
   * @param value
   * @param state
   * @param contextId
   */
  protected addValueState(
    value: any,
    state: boolean,
    contextId: string | undefined,
  ): void {
    if (!(typeof contextId === 'string')) {
      return;
    }

    let mappedValue: MappedValueType<T>[] | undefined =
      this.valueMap.get(contextId);

    if (!mappedValue) {
      mappedValue = [];
    }

    mappedValue.push({ value, state });

    this.valueMap.set(contextId, mappedValue);
  }
}

const decoratorMethod = <T>(
  validator: BaseValidatorConstructor,
  validationOptions?: ValidationOptions,
  config: T | undefined = undefined,
) => {
  const constraints = [validationOptions || {}];
  if (!!config) {
    constraints.push(config);
  }

  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints,
      validator,
    });
  };
};

export function ValidatorDecorator(
  validator: BaseValidatorConstructor,
): DecoratorFunctionWithoutConfig;
export function ValidatorDecorator<T>(
  validator: BaseValidatorConstructor,
  hasConfig: true,
): DecoratorFunctionWithConfig<T>;
export function ValidatorDecorator<T = any>(
  validator: BaseValidatorConstructor,
  hasConfig = false,
): DecoratorFunctionWithConfig<T> | DecoratorFunctionWithoutConfig {
  if (!!hasConfig) {
    return (config: T, validationOptions?: ValidationOptions) => {
      return decoratorMethod(validator, validationOptions, config);
    };
  }

  return (validationOptions?: ValidationOptions) => {
    return decoratorMethod(validator, validationOptions);
  };
}
