import { TotalsService } from './totals.service';

describe('TotalsService', () => {
  const t = new TotalsService();

  it('applies 10% discount over 100 and US 8% tax', () => {
    const { discount, tax, total } = t.compute(200, 'US');
    expect(discount).toBeCloseTo(20);
    expect(tax).toBeCloseTo((200 - 20) * 0.08);
    expect(total).toBeCloseTo((200 - 20) * 1.08);
  });

  it('no discount <= 100, CA 13% tax', () => {
    const { discount, tax, total } = t.compute(80, 'CA');
    expect(discount).toBe(0);
    expect(tax).toBeCloseTo(80 * 0.13);
    expect(total).toBeCloseTo(80 * 1.13);
  });
});
