import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Customer } from './entities/customer.entity';
import { Product } from './entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { Location } from './entities/location.entity';
import { CreateOrderDto , UpdateOrderDto} from './dto';

@Injectable()
export class OrderService {
  constructor(
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
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const { customerId, locationId, items, notes } = createOrderDto;

    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const location = await this.locationRepository.findOne({ where: { id: locationId } });
    if (!location) {
      throw new BadRequestException('Location not found');
    }

    let totalAmount = 0;
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      const orderItem = new OrderItem();
      orderItem.productId = product.id;
      orderItem.quantity = item.quantity;
      orderItem.unitPrice = product.price;
      orderItem.totalPrice = itemTotal;
      orderItems.push(orderItem);

      product.stockQuantity -= item.quantity;
      await this.productRepository.save(product);
    }

    if (totalAmount > 100) {
      totalAmount *= 0.9;
    }

    if (location.country === 'US') {
      totalAmount *= 1.08;
    } else if (location.country === 'CA') {
      totalAmount *= 1.13;
    }

    const order = new Order();
    order.customerId = customerId;
    order.locationId = locationId;
    order.status = OrderStatus.PENDING;
    order.totalAmount = totalAmount;
    order.notes = notes;

    const savedOrder = await this.orderRepository.save(order);

    for (const item of orderItems) {
      item.orderId = savedOrder.id;
      await this.orderItemRepository.save(item);
    }

    this.sendOrderConfirmationEmail(customer.email, savedOrder.id);
    console.log(`Order ${savedOrder.id} created for customer ${customer.email}`);

    return savedOrder;
  }

  private sendOrderConfirmationEmail(email: string, orderId: string) {
    console.log(`Sending confirmation email to ${email} for order ${orderId}`);
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
    
    if (!order) {
      throw new BadRequestException('Order not found');
    }

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
        this.sendShippingNotification(order.customer.email, order.id);
      }
    }

    if (updateOrderDto.notes) {
      order.notes = updateOrderDto.notes;
    }

    return this.orderRepository.save(order);
  }

  private sendShippingNotification(email: string, orderId: string) {
    console.log(`Sending shipping notification to ${email} for order ${orderId}`);
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
    const productSales = {};

    for (const order of orders) {
      totalRevenue += Number(order.totalAmount);
      
      for (const item of order.items) {
        if (!productSales[item.product.name]) {
          productSales[item.product.name] = 0;
        }
        productSales[item.product.name] += item.quantity;
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