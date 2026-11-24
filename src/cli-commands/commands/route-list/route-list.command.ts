import { Command, CommandRunner } from 'nest-commander';
import { RouteListService } from './route-list.service';

@Command({ name: 'route:list', description: 'List the registered HTTP routes' })
export class RouteListCommand extends CommandRunner {
  constructor(private readonly service: RouteListService) {
    super();
  }

  run(): Promise<void> {
    this.service.listRoutes();
    return Promise.resolve();
  }
}
