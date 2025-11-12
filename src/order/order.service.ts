import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Customer } from './entities/customer.entity';
import { Product } from './entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { Location } from './entities/location.entity';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { OrderValidator } from './validator.service';
import { TotalsService } from './totals.service';
import { DomainEvents } from '../shared/domain-events';

@Injectable()
export class OrderService {
  constructor(
    private readonly ds: DataSource,

    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,


    private readonly validator: OrderValidator,
    private readonly totals: TotalsService,
    private readonly events: DomainEvents,
  ) {}


  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {

    try {
      this.validator.validate(createOrderDto);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }

    const { customerId, locationId, items, notes } = createOrderDto;

    // Fetch customer + location in parallel
    const [customer, location] = await Promise.all([
      this.customerRepository.findOne({ where: { id: customerId } }),
      this.locationRepository.findOne({ where: { id: locationId } }),
    ]);
    if (!customer) throw new BadRequestException('Customer not found');
    if (!location) throw new BadRequestException('Location not found');

    // Bulk fetch all distinct products in one query (no N+1)
    const productIds = Array.from(new Set(items.map(i => i.productId)));
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
    });

    // Existence check
    const foundIds = new Set(products.map(p => p.id));
    const missing = productIds.find(id => !foundIds.has(id));
    if (missing) throw new BadRequestException(`Product ${missing} not found`);

    // Compute subtotal & check stock in memory
    const byId = new Map(products.map(p => [p.id, p]));
    let subtotal = 0;
    const lineItems = items.map(it => {
      const p = byId.get(it.productId)!;
      if (p.stockQuantity < it.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${p.name}`);
      }
      const unitPrice = Number(p.price);
      const lineTotal = unitPrice * it.quantity;
      subtotal += lineTotal;
      return {
        productId: it.productId,
        qty: it.quantity,
        unitPrice,
        lineTotal,
      };
    });

    // Apply discount/tax rules via TotalsService
    const { total } = this.totals.compute(subtotal, location.country);

    // Single transaction: update stock, save order, save items
    return this.ds.transaction(async manager => {
      // Update stock in memory then batch-save once
      for (const li of lineItems) {
        const p = byId.get(li.productId)!;
        p.stockQuantity -= li.qty;
      }
      await manager.getRepository(Product).save(products);

      // Create & save order
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);

      const order = orderRepo.create({
        customerId,
        locationId,
        status: OrderStatus.PENDING,
        totalAmount: Number(total.toFixed(2)),
        notes,
      });
      const savedOrder = await orderRepo.save(order);

      // Create all items and save in one call
      const itemsEntities = lineItems.map(li =>
        orderItemRepo.create({
          orderId: savedOrder.id,
          productId: li.productId,
          quantity: li.qty,
          unitPrice: li.unitPrice,
          totalPrice: li.lineTotal,
        }),
      );
      await orderItemRepo.save(itemsEntities);

      // Publish domain event (no direct side-effects)
      await this.events.publish('order.created', {
        orderId: savedOrder.id,
        customerEmail: customer.email,
      });

      return savedOrder;
      
    });
    
  }


 
  async findAll(): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.location', 'location')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.location', 'location')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('order.id = :id', { id })
      .getOne();

    if (!order) throw new BadRequestException('Order not found');
    return order;
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (updateOrderDto.status) {
      if (order.status === OrderStatus.DELIVERED && updateOrderDto.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException('Cannot change status of delivered order');
      }
      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Cannot update cancelled order');
      }
      order.status = updateOrderDto.status;

      if (updateOrderDto.status === OrderStatus.SHIPPED) {
        // Use domain event instead of direct side-effect
        await this.events.publish('order.shipped', {
          orderId: order.id,
          customerId: order.customerId,
        });
      }
    }

    if (updateOrderDto.notes != null) {
      order.notes = updateOrderDto.notes;
    }

    return this.orderRepository.save(order);
  }

  async deleteOrder(id: string): Promise<void> {
    const order = await this.findOne(id);
    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot delete shipped or delivered orders');
    }
    await this.orderRepository.remove(order);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.location', 'location')
      .where('order.customerId = :customerId', { customerId })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async generateOrderReport(locationId: string): Promise<any> {
    const orders = await this.orderRepository.find({
      where: { locationId },
      relations: ['items', 'items.product'],
    });

    let totalRevenue = 0;
    const productSales: Record<string, number> = {};

    for (const order of orders) {
      totalRevenue += Number(order.totalAmount);
      for (const item of order.items) {
        const name = item.product?.name ?? item.productId;
        productSales[name] = (productSales[name] ?? 0) + item.quantity;
      }
    }

    return {
      locationId,
      totalOrders: orders.length,
      totalRevenue,
      productSales,
      generatedAt: new Date(),
    };
    }
}
