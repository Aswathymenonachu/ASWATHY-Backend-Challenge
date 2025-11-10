import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { Customer } from './entities/customer.entity';
import { Product } from './entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { Location } from './entities/location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Customer, Product, OrderItem, Location]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}