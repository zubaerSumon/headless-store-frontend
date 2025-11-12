'use server';

import WooCommerceRestApi from 'woocommerce-rest-ts-api';

const woocommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_STORE_URL || '',
  consumerKey: process.env.WC_CONSUMER_KEY as string,
  consumerSecret: process.env.WC_CONSUMER_SECRET as string,
  version: 'wc/v3',
});

interface CustomerData {
  id?: number;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  billing?: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

interface GetCustomerResponse {
  success: boolean;
  customer?: CustomerData;
  error?: string;
}

interface UpdateCustomerResponse {
  success: boolean;
  customer?: CustomerData;
  error?: string;
}

/**
 * Get customer details by ID
 * Note: This requires the customer ID from the JWT token or session
 */
export async function getCustomer(customerId: number): Promise<GetCustomerResponse> {
  try {
    const response = await woocommerce.get(`customers/${customerId}`);
    
    if (response.data && response.data.id) {
      return {
        success: true,
        customer: response.data,
      };
    }

    return {
      success: false,
      error: 'Customer not found.',
    };
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || 
                        error?.message || 
                        'Failed to fetch customer details.';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update customer details
 */
export async function updateCustomer(
  customerId: number,
  customerData: Partial<CustomerData>
): Promise<UpdateCustomerResponse> {
  try {
    const response = await woocommerce.put(`customers/${customerId}`, customerData);
    
    if (response.data && response.data.id) {
      return {
        success: true,
        customer: response.data,
      };
    }

    return {
      success: false,
      error: 'Failed to update customer details.',
    };
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || 
                        error?.message || 
                        'Failed to update customer details.';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

