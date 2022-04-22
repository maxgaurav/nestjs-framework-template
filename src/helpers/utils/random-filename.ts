export const randomFilename = (mimetype: string): string => {
  const extension = mimetype.split('/');
  const name = Math.random().toString(36).substring(2);
  return `${name}.${extension[extension.length - 1]}`;
};
