import { FilesystemConfig } from '../environment-types.interface';

export const filesystemConfig = () => ({
  filesystem: {
    defaultDriver: 'local',
  } as FilesystemConfig,
});
