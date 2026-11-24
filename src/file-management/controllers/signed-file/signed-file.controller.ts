import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { serveSignedUrl, StorageDisk } from '@nestjs/storage';
import type { Request, Response } from 'express';
import { MapDiskToParamPipe } from '../../pipes/map-disk-to-param/map-disk-to-param.pipe.js';

/**
 * Serves signed download links of local disks (`disk.signedUrl(key)`). The signature in the
 * query is the authorization, so there is no auth guard; it streams files, so no resource
 * conversion and no API versioning.
 */
@ApiExcludeController()
@Controller('files')
export class SignedFileController {
  @Get(':disk')
  public download(
    @Param('disk', MapDiskToParamPipe) disk: StorageDisk,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return serveSignedUrl(disk, { req, res });
  }
}
