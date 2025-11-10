import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CustomerModule } from './customer/customer.module';
import { ProductModule } from './product/product.module';
import { LocationModule } from './location/location.module';
import { Order, Customer, Product, OrderItem, Location } from './order/entities';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'challenge_user',
      password: process.env.DB_PASSWORD || 'challenge_pass',
      database: process.env.DB_DATABASE || 'fs_challenge',
      entities: [Order, Customer, Product, OrderItem, Location],
      synchronize: true, // Only for development
      logging: true,
    }),
    OrderModule,
    CustomerModule,
    ProductModule,
    LocationModule,
  ],
})
export class AppModule {}