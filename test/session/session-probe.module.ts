import { Controller, Get, Module, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AppModule } from '../../src/app.module.js';
import { UseSession } from '../../src/session-manager/decorators/use-session.decorator.js';

type ProbeSession = { visits?: number };

const visits = (req: Request): number | null =>
  req.session ? ((req.session as ProbeSession).visits ?? 0) : null;

/** Stateless versioned API route (/api/v1/session-probe) */
@Controller({ path: 'session-probe', version: '1' })
export class StatelessApiProbeController {
  @Get()
  public show(@Req() req: Request) {
    return { hasSession: req.session !== undefined };
  }
}

/** API route that opts in to the web session (/api/v1/session-probe-cookie) */
@UseSession()
@Controller({ path: 'session-probe-cookie', version: '1' })
export class CookieApiProbeController {
  @Get()
  public show(@Req() req: Request) {
    return { hasSession: req.session !== undefined, visits: visits(req) };
  }

  @Post()
  public increment(@Req() req: Request) {
    (req.session as ProbeSession).visits = (visits(req) ?? 0) + 1;
    return { visits: visits(req) };
  }
}

/** Web route that writes to the session (/session-probe-web) */
@Controller('session-probe-web')
export class WebProbeController {
  @Get()
  public visit(@Req() req: Request) {
    (req.session as ProbeSession).visits = (visits(req) ?? 0) + 1;
    return { visits: visits(req) };
  }
}

@Module({
  imports: [AppModule],
  controllers: [
    StatelessApiProbeController,
    CookieApiProbeController,
    WebProbeController,
  ],
})
export class SessionProbeModule {}
