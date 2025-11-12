import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../redis/redis.module';
import { LocationRateLimitGuard } from '../common/location-rate-limit.guard';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { Customer } from './entities/customer.entity';
import { Product } from './entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { Location } from './entities/location.entity';
import { OrderValidator } from './validator.service';
import { TotalsService } from './totals.service';
import { DomainEvents } from '../shared/domain-events';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Customer, Product, OrderItem, Location]),
    RedisModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderValidator,
    TotalsService,
    DomainEvents,
    LocationRateLimitGuard,
  ],
  exports: [OrderService],
})
export class OrderModule {}
