export const DefaultConnectionModels: unknown[] = [];

export function RegisterModel() {
  return (target: unknown) => {
    DefaultConnectionModels.push(target);
  };
}
