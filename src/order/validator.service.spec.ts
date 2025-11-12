import { OrderValidator } from './validator.service';

describe('OrderValidator', () => {
  const v = new OrderValidator();

  it('passes valid dto', () => {
    expect(() =>
      v.validate({
        customerId: 'C1',
        locationId: 'L1',
        items: [{ productId: 'P1', quantity: 1 }],
      } as any)
    ).not.toThrow();
  });

  it('fails on empty items', () => {
    expect(() =>
      v.validate({ customerId: 'C1', locationId: 'L1', items: [] } as any)
    ).toThrow('Order must contain at least one item');
  });

  it('fails on bad quantity', () => {
    expect(() =>
      v.validate({ customerId: 'C1', locationId: 'L1', items: [{ productId: 'P1', quantity: 0 }] } as any)
    ).toThrow();
  });
});
