import { FilesystemConfig } from '../environment-types.interface.js';

export const filesystemConfig = () => ({
  filesystem: {
    defaultDriver: 'local',
  } as FilesystemConfig,
});
