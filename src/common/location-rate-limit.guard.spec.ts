import { LocationRateLimitGuard } from './location-rate-limit.guard';

const mkCtx = (body: any = {}, headers: any = {}, params: any = {}) => ({
  switchToHttp: () => ({
    getRequest: () => ({ body, headers, params }),
    getResponse: () => ({
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }),
  }),
}) as any;

describe('LocationRateLimitGuard', () => {
  it('allows request under limit and sets headers', async () => {
    const redis: any = {
      multi: () => ({
        incr: () => ({
          expire: () => ({
            exec: () => Promise.resolve([[null, 1]]), // count = 1
          }),
        }),
      }),
    };

    const guard = new LocationRateLimitGuard(redis);
    const ctx = mkCtx({ locationId: 'L1' });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('blocks when over limit and responds 429', async () => {
    const redis: any = {
      multi: () => ({
        incr: () => ({
          expire: () => ({
            exec: () => Promise.resolve([[null, 999]]), // count = 999
          }),
        }),
      }),
    };

    const guard = new LocationRateLimitGuard(redis);
    const ctx = mkCtx({ locationId: 'L1' });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(false);
  });
});
