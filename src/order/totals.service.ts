import { Injectable } from '@nestjs/common';

@Injectable()
export class TotalsService {
  /**
   * Applies business rules to a subtotal:
   *  - If subtotal > 100 → 10% discount
   *  - Tax by country: US = 8%, CA = 13%, else 0
   */
  compute(subtotal: number, country?: string | null): {
    discount: number; tax: number; total: number;
  } {
    const discount = subtotal > 100 ? subtotal * 0.10 : 0;
    const taxableBase = subtotal - discount;

    let taxRate = 0;
    if (country === 'US') taxRate = 0.08;
    else if (country === 'CA') taxRate = 0.13;

    const tax = taxableBase * taxRate;
    const total = taxableBase + tax;
    return { discount, tax, total: Number(total.toFixed(2)) };
  }
}
