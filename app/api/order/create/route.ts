import { NextResponse } from "next/server";
import WooCommerceRestApi from 'woocommerce-rest-ts-api';

const woocommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_STORE_URL || '',
  consumerKey: process.env.WC_CONSUMER_KEY as string,
  consumerSecret: process.env.WC_CONSUMER_SECRET as string,
  version: 'wc/v3',
});

export async function POST(req: Request) {
  try {
    const { paymentMethod, shippingAddress, items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!shippingAddress.address || !shippingAddress.phone) {
      return NextResponse.json(
        { error: "Address and phone number are required" },
        { status: 400 }
      );
    }

    // Get customer ID from email if exists
    let customerId: number | undefined;
    if (shippingAddress.email) {
      try {
        const customers = await woocommerce.get('customers', { 
          email: shippingAddress.email, 
          per_page: 1 
        });
        if (customers.data && customers.data.length > 0) {
          customerId = customers.data[0].id;
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    }

    // Build line items for WooCommerce order
    const woocommerceLineItems = items.map((item: any) => ({
      product_id: parseInt(item.id) || undefined,
      name: item.name || 'Product',
      quantity: item.quantity || 1,
      total: ((item.price || 0) * (item.quantity || 1)).toFixed(2),
    }));

    // Calculate total
    const total = items.reduce(
      (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
      0
    ).toFixed(2);

    // Determine payment method title
    let paymentMethodTitle = 'Cash on Delivery';
    if (paymentMethod === 'stripe') {
      paymentMethodTitle = 'Credit Card (Stripe)';
    } else if (paymentMethod === 'sslcommerz') {
      paymentMethodTitle = 'SSL Commerz';
    }

    // Determine order status based on payment method
    let orderStatus = 'pending';
    if (paymentMethod === 'cod') {
      orderStatus = 'processing'; // COD orders are processing until delivered
    } else {
      orderStatus = 'pending'; // Online payments start as pending
    }

    // Prepare order data for WooCommerce
    const orderData: any = {
      status: orderStatus,
      currency: 'USD',
      customer_id: customerId,
      billing: {
        first_name: shippingAddress.firstName || '',
        last_name: shippingAddress.lastName || '',
        email: shippingAddress.email || '',
        phone: shippingAddress.phone || '',
        address_1: shippingAddress.address || '',
        address_2: shippingAddress.address2 || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        postcode: shippingAddress.postcode || '',
        country: shippingAddress.country || 'US',
      },
      shipping: {
        first_name: shippingAddress.firstName || '',
        last_name: shippingAddress.lastName || '',
        address_1: shippingAddress.address || '',
        address_2: shippingAddress.address2 || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        postcode: shippingAddress.postcode || '',
        country: shippingAddress.country || 'US',
      },
      line_items: woocommerceLineItems,
      payment_method: paymentMethod,
      payment_method_title: paymentMethodTitle,
      meta_data: [
        {
          key: '_payment_method',
          value: paymentMethod,
        },
      ],
    };

    // Create order in WooCommerce
    const orderResponse = await woocommerce.post('orders', orderData);

    if (orderResponse.data && orderResponse.data.id) {
      return NextResponse.json({
        success: true,
        order: {
          id: orderResponse.data.id,
          order_key: orderResponse.data.order_key,
          status: orderResponse.data.status,
          total: orderResponse.data.total,
          currency: orderResponse.data.currency,
          date_created: orderResponse.data.date_created,
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        error: error.message || "Error creating order",
        details: error.response?.data || "Unknown error",
      },
      { status: 500 }
    );
  }
}

