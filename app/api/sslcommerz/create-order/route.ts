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
    const { tran_id, items, shippingAddress, customerId, amount, currency } = await req.json();

    if (!tran_id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

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

    // Check if order already exists
    let existingOrderId: number | null = null;
    try {
      const recentOrders = await woocommerce.get('orders', {
        per_page: 20,
        orderby: 'date',
        order: 'desc',
      } as any);

      if (recentOrders.data) {
        for (const order of recentOrders.data) {
          if (order.meta_data && Array.isArray(order.meta_data)) {
            const tranIdMeta = order.meta_data.find(
              (meta: any) => meta.key === '_sslcommerz_tran_id' && meta.value === tran_id
            );
            if (tranIdMeta) {
              existingOrderId = order.id;
              return NextResponse.json({
                success: true,
                orderId: existingOrderId,
                alreadyExists: true,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking for existing order:", error);
    }

    // Get customer ID if not provided
    let finalCustomerId: number | undefined = customerId;
    if (!finalCustomerId && shippingAddress.email) {
      try {
        const customers = await woocommerce.get('customers', {
          email: shippingAddress.email,
          per_page: 1,
        });
        if (customers.data && customers.data.length > 0) {
          finalCustomerId = customers.data[0].id;
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    }

    // Build line items
    const woocommerceLineItems = items.map((item: any) => ({
      product_id: parseInt(item.id) || undefined,
      name: item.name || 'Product',
      quantity: item.quantity || 1,
      total: ((item.price || 0) * (item.quantity || 1)).toFixed(2),
    }));

    // Calculate total
    const total = amount ? parseFloat(amount).toFixed(2) : items.reduce(
      (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
      0
    ).toFixed(2);

    // Create order
    const orderData: any = {
      status: 'processing',
      currency: currency || 'BDT',
      customer_id: finalCustomerId,
      total: total,
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
        country: shippingAddress.country || 'BD',
      },
      shipping: {
        first_name: shippingAddress.firstName || '',
        last_name: shippingAddress.lastName || '',
        address_1: shippingAddress.address || '',
        address_2: shippingAddress.address2 || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        postcode: shippingAddress.postcode || '',
        country: shippingAddress.country || 'BD',
      },
      line_items: woocommerceLineItems,
      payment_method: 'sslcommerz',
      payment_method_title: 'SSL Commerz',
      meta_data: [
        {
          key: '_sslcommerz_tran_id',
          value: tran_id,
        },
      ],
    };

    const orderResponse = await woocommerce.post('orders', orderData);
    const createdOrderId = orderResponse.data?.id;

    return NextResponse.json({
      success: true,
      orderId: createdOrderId,
      alreadyExists: false,
    });
  } catch (error: any) {
    console.error('Error creating SSL Commerz order from success page:', error);
    return NextResponse.json(
      {
        error: error.message || "Error creating order",
        details: error.response?.data || "Unknown error",
      },
      { status: 500 }
    );
  }
}

