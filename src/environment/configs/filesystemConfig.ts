import { FilesystemConfig } from '../interfaces/environment-types.interface';

export const filesystemConfig = () => ({
  filesystem: {
    defaultDriver: 'local',
  } as FilesystemConfig,
});
