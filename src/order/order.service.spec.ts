import { Test } from '@nestjs/testing';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from './entities/product.entity';
import { Customer } from './entities/customer.entity';
import { Location } from './entities/location.entity';

import { OrderValidator } from './validator.service';
import { TotalsService } from './totals.service';
import { DomainEvents } from '../shared/domain-events';
import { OrderStatus } from './entities/order.entity';

function repoMock<T>() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    create: jest.fn((x) => x),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('OrderService', () => {
  let service: OrderService;

  let ds: Partial<DataSource>;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let itemRepo: jest.Mocked<Repository<OrderItem>>;
  let productRepo: jest.Mocked<Repository<Product>>;
  let customerRepo: jest.Mocked<Repository<Customer>>;
  let locationRepo: jest.Mocked<Repository<Location>>;
  let events: DomainEvents;

  beforeEach(async () => {
    orderRepo = repoMock<Order>();
    itemRepo = repoMock<OrderItem>();
    productRepo = repoMock<Product>();
    customerRepo = repoMock<Customer>();
    locationRepo = repoMock<Location>();

    // fake transaction wrapper: passes a fake manager with getRepository
    ds = {
      transaction: async (fn: any) => {
        const manager = {
          getRepository: (e: any) => {
            if (e === Order) return orderRepo;
            if (e === OrderItem) return itemRepo;
            if (e === Product) return productRepo;
            throw new Error('unexpected repo');
          },
        } as any;
        return fn(manager);
      },
    };

    events = { publish: jest.fn(async () => undefined) } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        OrderValidator,
        TotalsService,
        { provide: DomainEvents, useValue: events },
        { provide: DataSource, useValue: ds },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: itemRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: getRepositoryToken(Location), useValue: locationRepo },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  it('creates order (happy path) using bulk product fetch and single transaction', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'C1', email: 'a@b.com' } as any);
    locationRepo.findOne.mockResolvedValue({ id: 'L1', country: 'US' } as any);

    // products returned in one query
    productRepo.find.mockResolvedValue([
      { id: 'P1', price: 50, stockQuantity: 10, name: 'P1' },
      { id: 'P2', price: 60, stockQuantity: 5,  name: 'P2' },
    ] as any);

    // order save returns an id
    orderRepo.save.mockImplementation(async (o: any) => ({ ...o, id: 'O1' }));

    // batch saves (assert we call them once)
    productRepo.save?.mockResolvedValue?.([] as any);
    itemRepo.save.mockResolvedValue([] as any);

    const dto = {
      customerId: 'C1',
      locationId: 'L1',
      items: [
        { productId: 'P1', quantity: 1 },
        { productId: 'P2', quantity: 2 },
      ],
      notes: 'note',
    } as any;

    const result = await service.createOrder(dto);

    expect(result.id).toBe('O1');

    // ensure bulk fetch was used (one call)
    expect(productRepo.find).toHaveBeenCalledTimes(1);

    // ensure we batch-saved products and items once each inside transaction
    expect(productRepo.save).toHaveBeenCalledTimes(1);
    expect(itemRepo.save).toHaveBeenCalledTimes(1);

    // domain event fired
    expect(events.publish).toHaveBeenCalledWith('order.created', expect.objectContaining({ orderId: 'O1' }));
  });

  it('fails when a requested product is missing', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'C1' } as any);
    locationRepo.findOne.mockResolvedValue({ id: 'L1', country: 'US' } as any);
    productRepo.find.mockResolvedValue([] as any);

    await expect(
      service.createOrder({
        customerId: 'C1',
        locationId: 'L1',
        items: [{ productId: 'PX', quantity: 1 }],
      } as any)
    ).rejects.toThrow('Product PX not found');
  });

  it('fails when stock is insufficient', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'C1' } as any);
    locationRepo.findOne.mockResolvedValue({ id: 'L1', country: 'US' } as any);
    productRepo.find.mockResolvedValue([{ id: 'P1', price: 10, stockQuantity: 0, name: 'Prod' }] as any);

    await expect(
      service.createOrder({
        customerId: 'C1',
        locationId: 'L1',
        items: [{ productId: 'P1', quantity: 1 }],
      } as any)
    ).rejects.toThrow('Insufficient stock for product Prod');
  });

  it('updateOrder -> SHIPPED publishes event and saves', async () => {
    // arrange findOne used by updateOrder
    (orderRepo.createQueryBuilder as any).mockReturnValue({
      leftJoinAndSelect: function () { return this; },
      where: function () { return this; },
      getOne: async () => ({
        id: 'O1',
        customerId: 'C1',
        status: OrderStatus.PENDING,
        notes: 'n',
      }),
    });

    orderRepo.save.mockImplementation(async (o: any) => o);

    const updated = await service.updateOrder('O1', { status: OrderStatus.SHIPPED });

    expect(events.publish).toHaveBeenCalledWith('order.shipped', expect.objectContaining({ orderId: 'O1' }));
    expect(updated.status).toBe(OrderStatus.SHIPPED);
  });
});
