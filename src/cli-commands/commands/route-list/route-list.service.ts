import { Injectable, Logger } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { HttpAdapterHost } from '@nestjs/core';
import { IRoute, Router } from 'express';

@Injectable()
export class RouteListService {
  constructor(
    private logger: Logger,
    private adapterHost: HttpAdapterHost,
  ) {}

  @Command({
    command: 'route:list',
    describe: 'Returns list of routes registered',
  })
  listRoutes() {
    const server = this.adapterHost.httpAdapter.getHttpServer() as {
      _events: { request: { router: Router } };
    };
    const router = server._events.request.router;
    this.logger.log('RouteListService', 'List Of Routes are');
    this.logger.log(
      'RouteListService',
      '-------------START OF ROUTE LIST--------------------',
    );

    router.stack
      .map((layer) => {
        if (layer.route) {
          const path = (layer.route as IRoute)?.path;
          const method = layer.route?.stack[0].method;
          return `${method.toUpperCase()} ${path}`;
        }
      })
      .filter((item) => item !== undefined)
      .forEach((route) => this.logger.log('RouteListService', route));
    this.logger.log(
      'RouteListService',
      '-------------END OF ROUTE LIST----------------------',
    );
  }
}
