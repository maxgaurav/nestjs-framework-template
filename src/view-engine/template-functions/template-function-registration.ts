import { ExtendFunctionConstructor } from './extend-function';

export const TemplateFunctionRegistrations: ExtendFunctionConstructor[] = [];

export const TemplateRegister = () => (target: ExtendFunctionConstructor) => {
  TemplateFunctionRegistrations.push(target);
};
