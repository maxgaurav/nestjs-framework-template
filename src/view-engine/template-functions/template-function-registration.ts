import { ExtendFunctionConstructor } from './extend-function.js';

export const TemplateFunctionRegistrations: ExtendFunctionConstructor[] = [];

export const TemplateRegister = () => (target: ExtendFunctionConstructor) => {
  TemplateFunctionRegistrations.push(target);
};
