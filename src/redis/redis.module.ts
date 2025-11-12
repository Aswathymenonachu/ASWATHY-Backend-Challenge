import { Module } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: (): Redis =>
        new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
