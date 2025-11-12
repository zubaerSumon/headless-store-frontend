'use server';

import WooCommerceRestApi from 'woocommerce-rest-ts-api';

const woocommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_STORE_URL || '',
  consumerKey: process.env.WC_CONSUMER_KEY as string,
  consumerSecret: process.env.WC_CONSUMER_SECRET as string,
  version: 'wc/v3',
});

export interface Order {
  id: number;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: string;
    image?: {
      src: string;
    };
  }>;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

export interface GetOrdersResponse {
  success: boolean;
  orders?: Order[];
  error?: string;
}

/**
 * Get orders for a specific customer
 * Can search by customer ID or email
 */
export async function getCustomerOrders(customerId?: number, email?: string): Promise<GetOrdersResponse> {
  try {
    if (!customerId && !email) {
      return {
        success: false,
        error: 'Customer ID or email is required',
      };
    }

    // Try to fetch by customer ID first
    let response;
    let ordersByCustomerId: any[] = [];
    if (customerId) {
      try {
        response = await woocommerce.get('orders', {
          customer: customerId,
          per_page: 100,
          orderby: 'date',
          order: 'desc',
        } as any);
        if (response.data && response.data.length > 0) {
          ordersByCustomerId = response.data;
        }
      } catch (error) {
        console.error('Error fetching orders by customer ID:', error);
        // Fall through to email search
      }
    }

    // Also search by email to catch orders that might not have customer_id set
    let ordersByEmail: any[] = [];
    if (email) {
      try {
        // Get recent orders and filter by email
        const emailResponse = await woocommerce.get('orders', {
          per_page: 100,
          orderby: 'date',
          order: 'desc',
        });
        
        // Filter to only orders with matching billing email
        if (emailResponse.data) {
          ordersByEmail = emailResponse.data.filter((order: any) => 
            order.billing?.email?.toLowerCase() === email.toLowerCase()
          );
        }
      } catch (error) {
        console.error('Error fetching orders by email:', error);
      }
    }

    // Combine and deduplicate orders
    const allOrders = [...ordersByCustomerId, ...ordersByEmail];
    const uniqueOrders = allOrders.filter((order, index, self) =>
      index === self.findIndex((o) => o.id === order.id)
    );

    // Sort by date (most recent first)
    uniqueOrders.sort((a, b) => {
      const dateA = new Date(a.date_created).getTime();
      const dateB = new Date(b.date_created).getTime();
      return dateB - dateA;
    });

    if (uniqueOrders.length > 0) {
      return {
        success: true,
        orders: uniqueOrders,
      };
    }

    // If we reach here, no orders were found
    return {
      success: true,
      orders: [],
    };
  } catch (error: any) {
    console.error('Error fetching customer orders:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch orders',
    };
  }
}

/**
 * Get a single order by ID
 */
export async function getOrder(orderId: number): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
}> {
  try {
    if (!orderId) {
      return {
        success: false,
        error: 'Order ID is required',
      };
    }

    const response = await woocommerce.get(`orders/${orderId}`);

    if (response.data) {
      return {
        success: true,
        order: response.data,
      };
    }

    return {
      success: false,
      error: 'Order not found',
    };
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch order',
    };
  }
}

