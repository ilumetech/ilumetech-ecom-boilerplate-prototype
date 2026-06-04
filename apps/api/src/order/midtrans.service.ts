import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

interface MidtransCustomerDetails {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
}

interface MidtransItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

interface CreateTransactionInput {
  orderId: string;
  grossAmount: number;
  customerDetails: MidtransCustomerDetails;
  items: MidtransItem[];
  shippingAmount?: number;
  shippingMethod?: string;
  discountAmount?: number;
  promoCode?: string;
}

interface MidtransTransactionResponse {
  token: string;
  redirect_url: string;
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly serverKey = process.env.MIDTRANS_SERVER_KEY;
  private readonly isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  private readonly apiUrl = this.isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  async createTransaction(input: CreateTransactionInput): Promise<MidtransTransactionResponse> {
    if (!this.serverKey) {
      this.logger.warn('MIDTRANS_SERVER_KEY is not defined. Returning dummy transaction values.');
      return {
        token: 'dummy-snap-token',
        redirect_url: `https://app.sandbox.midtrans.com/snap/v1/transactions/dummy?orderId=${input.orderId}`,
      };
    }

    const itemDetails = input.items.map((item) => ({
      id: item.id,
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.name.slice(0, 50),
    }));

    if (input.shippingAmount && input.shippingAmount > 0) {
      itemDetails.push({
        id: 'shipping',
        price: Math.round(input.shippingAmount),
        quantity: 1,
        name: (input.shippingMethod || 'Shipping Fee').slice(0, 50),
      });
    }

    if (input.discountAmount && input.discountAmount > 0) {
      itemDetails.push({
        id: 'discount',
        price: -Math.round(input.discountAmount),
        quantity: 1,
        name: `Discount (${input.promoCode || 'PROMO'})`.slice(0, 50),
      });
    }

    const payload = {
      transaction_details: {
        order_id: input.orderId,
        gross_amount: Math.round(input.grossAmount),
      },
      item_details: itemDetails,
      customer_details: {
        first_name: input.customerDetails.firstName,
        last_name: input.customerDetails.lastName,
        email: input.customerDetails.email,
        phone: input.customerDetails.phone,
      },
      callbacks: {
        finish: `${process.env.STOREFRONT_URL || 'http://localhost:3000'}/success?orderId=${input.orderId}`,
        unfinish: `${process.env.STOREFRONT_URL || 'http://localhost:3000'}/success?orderId=${input.orderId}`,
        error: `${process.env.STOREFRONT_URL || 'http://localhost:3000'}/success?orderId=${input.orderId}`,
      },
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(this.serverKey + ':').toString('base64')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Midtrans API error: ${response.status} - ${errorText}`);
      throw new Error(`Midtrans API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<MidtransTransactionResponse>;
  }

  verifyNotificationSignature(body: any): boolean {
    if (!this.serverKey) {
      this.logger.warn('MIDTRANS_SERVER_KEY is not defined. Bypassing signature verification.');
      return true;
    }

    const { order_id, status_code, gross_amount, signature_key } = body;
    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return false;
    }

    const hash = crypto
      .createHash('sha512')
      .update(order_id + status_code + gross_amount + this.serverKey)
      .digest('hex');

    return hash === signature_key;
  }
}
