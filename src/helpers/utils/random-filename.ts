export const randomFilename = (mimetype: string): string => {
  const extension = mimetype.split('/');
  const name = crypto.randomUUID();
  return `${name}.${extension[extension.length - 1]}`;
};
