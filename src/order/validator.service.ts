import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrderValidator {
  validate(dto: CreateOrderDto): void {
    if (!dto) throw new Error('Body is required');
    if (!dto.customerId) throw new Error('Missing customerId');
    if (!dto.locationId) throw new Error('Missing locationId');

    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const bad = dto.items.find(i => !i.productId || i.quantity == null || i.quantity <= 0);
    if (bad) throw new Error('Each item needs a valid productId and quantity > 0');
  }
}
