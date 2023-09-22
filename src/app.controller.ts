import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('welcome')
  getHello(): { message: string } {
    return { message: this.appService.getHello() };
  }
}
