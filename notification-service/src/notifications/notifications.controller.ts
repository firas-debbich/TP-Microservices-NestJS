import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

interface OrderCreatedEvent {
  orderId: number;
  productId: number;
  quantity: number;
  customerEmail: string;
  status: string;
  createdAt: string;
  publishedAt: string;
}

@Controller()
export class NotificationsController {
  @MessagePattern('order.created')
  async handleOrderCreated(@Payload() event: OrderCreatedEvent) {
    const receivedAt = new Date().toISOString();

    console.log('\n' + '═'.repeat(60));
    console.log('🔔 [Kafka] order.created event received');
    console.log('═'.repeat(60));
    console.log(`📧 Customer:   ${event.customerEmail}`);
    console.log(`🆔 Order ID:   #${event.orderId}`);
    console.log(`📦 Product ID: #${event.productId}`);
    console.log(`🔢 Quantity:   ${event.quantity}`);
    console.log(`✅ Status:     ${event.status}`);
    console.log(`🕐 Published:  ${event.publishedAt}`);
    console.log(`🕑 Processed:  ${receivedAt}`);
    console.log('═'.repeat(60));

    await this.simulateSendEmail(event);

    console.log(`\n✉️  Confirmation sent to ${event.customerEmail} for order #${event.orderId}\n`);
  }

  private async simulateSendEmail(event: OrderCreatedEvent): Promise<void> {
    // Simulate async email sending delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    console.log(`
    ────────────────────────────────────
    📬 EMAIL SIMULATION
    To:      ${event.customerEmail}
    Subject: Order Confirmation #${event.orderId}
    ────────────────────────────────────
    Your order #${event.orderId} has been confirmed!
    Product ID: ${event.productId}
    Quantity:   ${event.quantity}
    Status:     ${event.status}
    Date:       ${new Date(event.createdAt).toLocaleString()}
    ────────────────────────────────────`);
  }
}