import { Injectable } from '@nestjs/common';

@Injectable()
export class DomainEvents {
  async publish(event: string, payload: any) {
    switch (event) {
      case 'order.created':
        this.sendOrderConfirmationEmail(payload.customerEmail, payload.orderId);
        break;

      case 'order.shipped':
        this.sendShippingNotification(payload.customerEmail, payload.orderId);
        break;

      default:
        console.log(`Unhandled domain event: ${event}`, payload);
    }
  }

  private sendOrderConfirmationEmail(email: string, orderId: string) {
    console.log(`📧 Order Confirmation: Sending confirmation email to ${email} for order ${orderId}`);
  }

  private sendShippingNotification(email: string, orderId: string) {
    console.log(`🚚 Shipping Notification: Sending shipping update to ${email} for order ${orderId}`);
  }
}

