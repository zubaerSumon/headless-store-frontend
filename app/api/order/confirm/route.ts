import { NextResponse } from "next/server";
import { stripe } from "@/app/api/checkout/route";
import WooCommerceRestApi from 'woocommerce-rest-ts-api';

const woocommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_STORE_URL || '',
  consumerKey: process.env.WC_CONSUMER_KEY as string,
  consumerSecret: process.env.WC_CONSUMER_SECRET as string,
  version: 'wc/v3',
});

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details'],
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Check if an order already exists for this session_id
    // WooCommerce REST API doesn't directly support meta_key/meta_value queries
    // So we fetch recent orders and check their metadata
    let existingOrderId: number | null = null;
    try {
      // Get recent orders (last 20) and check their metadata
      const recentOrders = await woocommerce.get('orders', {
        per_page: 20,
        orderby: 'date',
        order: 'desc',
      } as any);

      if (recentOrders.data) {
        for (const order of recentOrders.data) {
          // Check if order has the same session_id in metadata
          if (order.meta_data && Array.isArray(order.meta_data)) {
            const sessionIdMeta = order.meta_data.find(
              (meta: any) => meta.key === '_stripe_session_id' && meta.value === sessionId
            );
            if (sessionIdMeta) {
              existingOrderId = order.id;
              console.log('Found existing order for session:', sessionId, 'Order ID:', order.id);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for existing order:', error);
      // Continue to create order if check fails
    }

    // If order already exists, return it
    if (existingOrderId) {
      try {
        const existingOrder = await woocommerce.get(`orders/${existingOrderId}`);
        if (existingOrder.data) {
          return NextResponse.json({
            success: true,
            order: {
              id: existingOrder.data.id,
              order_key: existingOrder.data.order_key,
              status: existingOrder.data.status,
              total: existingOrder.data.total,
              currency: existingOrder.data.currency,
              date_created: existingOrder.data.date_created,
            },
            alreadyExists: true,
          });
        }
      } catch (error) {
        console.error('Error fetching existing order:', error);
        // Continue to create new order if fetch fails
      }
    }

    // Get line items from the session
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      expand: ['data.price.product'],
    });

    // Get cart items from session metadata
    let cartItems: any[] = [];
    if (session.metadata?.cart_items) {
      try {
        cartItems = JSON.parse(session.metadata.cart_items);
      } catch (error) {
        console.error('Error parsing cart items from metadata:', error);
      }
    }

    // Get shipping address from session metadata (if provided in form)
    let formShippingAddress: any = null;
    if (session.metadata?.shipping_address) {
      try {
        formShippingAddress = JSON.parse(session.metadata.shipping_address);
      } catch (error) {
        console.error('Error parsing shipping address from metadata:', error);
      }
    }

    // Get customer info from session
    // Prefer form data if available, otherwise use Stripe session data
    const customerEmail = formShippingAddress?.email || session.customer_details?.email || session.customer_email;
    const customerName = formShippingAddress 
      ? `${formShippingAddress.firstName || ''} ${formShippingAddress.lastName || ''}`.trim()
      : session.customer_details?.name || '';

    // Get customer ID from WooCommerce if exists
    let customerId: number | undefined;
    if (customerEmail) {
      try {
        const customers = await woocommerce.get('customers', { email: customerEmail, per_page: 1 });
        if (customers.data && customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log('Found customer ID:', customerId, 'for email:', customerEmail);
        } else {
          console.log('No customer found for email:', customerEmail, '- order will be created without customer_id');
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    }

    // Build line items for WooCommerce order
    const woocommerceLineItems = cartItems.length > 0
      ? cartItems.map((item: any) => ({
          product_id: parseInt(item.id) || undefined,
          name: item.name || 'Product',
          quantity: item.quantity || 1,
          total: ((item.price || 0) * (item.quantity || 1)).toFixed(2),
        }))
      : lineItems.data.map((item: any) => ({
          product_id: item.price?.product?.metadata?.woocommerce_product_id 
            ? parseInt(item.price.product.metadata.woocommerce_product_id) 
            : undefined,
          name: item.description || item.price?.product?.name || 'Product',
          quantity: item.quantity || 1,
          total: ((item.amount_total || 0) / 100).toFixed(2),
        }));

    // Prepare order data for WooCommerce
    const orderData: any = {
      status: 'processing', // or 'completed' depending on your needs
      currency: session.currency?.toUpperCase() || 'USD',
      customer_id: customerId,
      billing: {
        first_name: formShippingAddress?.firstName || customerName.split(' ')[0] || '',
        last_name: formShippingAddress?.lastName || customerName.split(' ').slice(1).join(' ') || '',
        email: customerEmail || '',
        phone: formShippingAddress?.phone || session.customer_details?.phone || '',
        address_1: formShippingAddress?.address || session.customer_details?.address?.line1 || '',
        address_2: formShippingAddress?.address2 || session.customer_details?.address?.line2 || '',
        city: formShippingAddress?.city || session.customer_details?.address?.city || '',
        state: formShippingAddress?.state || session.customer_details?.address?.state || '',
        postcode: formShippingAddress?.postcode || session.customer_details?.address?.postal_code || '',
        country: formShippingAddress?.country || session.customer_details?.address?.country || 'US',
      },
      shipping: {
        first_name: formShippingAddress?.firstName || customerName.split(' ')[0] || '',
        last_name: formShippingAddress?.lastName || customerName.split(' ').slice(1).join(' ') || '',
        address_1: formShippingAddress?.address || (session as any).shipping_details?.address?.line1 || session.customer_details?.address?.line1 || '',
        address_2: formShippingAddress?.address2 || (session as any).shipping_details?.address?.line2 || session.customer_details?.address?.line2 || '',
        city: formShippingAddress?.city || (session as any).shipping_details?.address?.city || session.customer_details?.address?.city || '',
        state: formShippingAddress?.state || (session as any).shipping_details?.address?.state || session.customer_details?.address?.state || '',
        postcode: formShippingAddress?.postcode || (session as any).shipping_details?.address?.postal_code || session.customer_details?.address?.postal_code || '',
        country: formShippingAddress?.country || (session as any).shipping_details?.address?.country || session.customer_details?.address?.country || 'US',
      },
      line_items: woocommerceLineItems,
      payment_method: 'stripe',
      payment_method_title: 'Credit Card (Stripe)',
      transaction_id: session.payment_intent,
      meta_data: [
        {
          key: '_stripe_session_id',
          value: sessionId,
        },
        {
          key: '_stripe_payment_intent',
          value: session.payment_intent,
        },
      ],
    };

    // Create order in WooCommerce
    const orderResponse = await woocommerce.post('orders', orderData);

    if (orderResponse.data && orderResponse.data.id) {
      console.log('Order created successfully:', {
        orderId: orderResponse.data.id,
        customerId: customerId,
        customerEmail: customerEmail,
        status: orderResponse.data.status,
      });

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
    console.error("Error confirming order:", error);
    return NextResponse.json(
      {
        error: error.message || "Error confirming order",
        details: error.response?.data || "Unknown error",
      },
      { status: 500 }
    );
  }
}

