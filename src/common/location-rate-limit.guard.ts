import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Response } from 'express';
import type { Redis } from 'ioredis';

@Injectable()
export class LocationRateLimitGuard implements CanActivate {
  private readonly windowSec = 60;
  private readonly limit = 10;

  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const res: Response = ctx.switchToHttp().getResponse();

    const locationId: string | undefined =
      req.body?.locationId || req.headers['x-location-id'] || req.params?.locationId;

    if (!locationId) return true;

    const now = Math.floor(Date.now() / 1000);
    const windowKey = `rl:loc:${locationId}:${Math.floor(now / this.windowSec)}`;

    // INCR current window; set expiry on first creation only (NX)
    const count = await this.redis
      .multi()
      .incr(windowKey)
      .expire(windowKey, this.windowSec, 'NX')
      .exec()
      .then(results => Number(results?.[0]?.[1] ?? 1));

    const remaining = Math.max(this.limit - count, 0);
    const reset = (Math.floor(now / this.windowSec) + 1) * this.windowSec;

    res.setHeader('X-RateLimit-Limit', String(this.limit));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(reset));

    if (count > this.limit) {
      res.status(429).json({ message: 'Rate limit exceeded for this location' });
      return false;
    }

    return true;
  }
}
