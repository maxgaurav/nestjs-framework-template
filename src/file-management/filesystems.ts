import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { join } from 'path';
import { FilesystemNames } from '../environment/interfaces/environment-types.interface';
import { diskStorage, StorageEngine } from 'multer';
import { randomFilename } from '../helpers/utils/random-filename';

export type UploadFilesystems = Record<
  FilesystemNames,
  { multer: MulterOptions; engine: StorageEngine | null }
>;

export const uploadFilesystems: UploadFilesystems = {
  local: {
    multer: {
      dest: join(process.cwd(), 'storage', 'uploads'),
    },
    engine: diskStorage({
      destination: join(process.cwd(), 'storage', 'uploads'),
      filename(
        req: Express.Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ) {
        callback(null, randomFilename(file.mimetype));
      },
    }),
  },
};
