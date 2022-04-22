import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class SetupUploadSystemsService implements OnModuleInit {
  public onModuleInit(): any {
    // setup all file systems multer here
    // example setup aws s3 multer, default setup would be a blank object but after this it would
    // have a storage and config keys as object properties
  }
}
