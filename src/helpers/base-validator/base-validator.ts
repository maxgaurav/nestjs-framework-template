import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraintInterface,
} from 'class-validator';

type BaseValidatorConstructor = {
  new (...args: any[]): ValidatorConstraintInterface;
};

type DecoratorReturnType = (object: any, propertyName: string) => void;

export type DecoratorFunctionWithoutConfig = (
  validationOptions?: ValidationOptions,
) => DecoratorReturnType;

export type DecoratorFunctionWithConfig<T> = (
  config: T,
  validationOptions?: ValidationOptions,
) => DecoratorReturnType;

const decoratorMethod = <T>(
  validator: BaseValidatorConstructor,
  validationOptions?: ValidationOptions,
  config: T | undefined = undefined,
) => {
  const constraints = [validationOptions || {}];
  if (config) {
    constraints.push(config);
  }

  return (object: object, propertyName: string) => {
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
  if (hasConfig) {
    return (config: T, validationOptions?: ValidationOptions) => {
      return decoratorMethod(validator, validationOptions, config);
    };
  }

  return (validationOptions?: ValidationOptions) => {
    return decoratorMethod(validator, validationOptions);
  };
}
