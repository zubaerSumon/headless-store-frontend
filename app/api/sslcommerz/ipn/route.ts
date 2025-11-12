import { NextResponse } from "next/server";
import WooCommerceRestApi from 'woocommerce-rest-ts-api';
import crypto from "crypto";

const woocommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_STORE_URL || '',
  consumerKey: process.env.WC_CONSUMER_KEY as string,
  consumerSecret: process.env.WC_CONSUMER_SECRET as string,
  version: 'wc/v3',
});

const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const SSLCOMMERZ_STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const paymentData: any = {};
    
    // Convert FormData to object
    formData.forEach((value, key) => {
      paymentData[key] = value.toString();
    });

    const {
      tran_id,
      status,
      val_id,
      amount,
      store_amount,
      currency,
      bank_tran_id,
      card_type,
      card_no,
      card_issuer,
      card_brand,
      card_issuer_country,
      card_issuer_country_code,
      currency_type,
      currency_amount,
      currency_rate,
      base_fair,
      value_a,
      value_b,
      value_c,
      value_d,
      verify_sign,
      verify_key,
      risk_level,
      risk_title,
    } = paymentData;

    // Validate the payment
    if (!tran_id || !status) {
      return NextResponse.json({ error: "Invalid payment data" }, { status: 400 });
    }

    // Verify the payment signature
    const verifyString = `${SSLCOMMERZ_STORE_ID}${tran_id}${status}${val_id}${amount}${currency}${SSLCOMMERZ_STORE_PASSWORD}`;
    const calculatedHash = crypto.createHash("sha512").update(verifyString).digest("hex");

    if (verify_sign !== calculatedHash) {
      console.error("SSL Commerz IPN verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse stored data
    let storedData: any = {};
    if (value_a) {
      try {
        storedData = JSON.parse(value_a);
      } catch (error) {
        console.error("Error parsing stored data:", error);
      }
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
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking for existing order:", error);
    }

    // If payment is successful and order doesn't exist, create it
    if (status === "VALID" && !existingOrderId) {
      const items = storedData.items || [];
      const shippingAddress = storedData.shippingAddress || {};
      let customerId: number | undefined = storedData.customerId;

      // If customerId wasn't stored, try to look it up by email as fallback
      if (!customerId && shippingAddress.email) {
        try {
          const customers = await woocommerce.get('customers', {
            email: shippingAddress.email,
            per_page: 1,
          });
          if (customers.data && customers.data.length > 0) {
            customerId = customers.data[0].id;
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
        }
      }

      // Warn if customerId is missing - order might not show in order history
      if (!customerId) {
        console.warn('SSL Commerz IPN: No customerId found. Order may not appear in customer order history.');
      }

      // Build line items
      const woocommerceLineItems = items.map((item: any) => ({
        product_id: parseInt(item.id) || undefined,
        name: item.name || 'Product',
        quantity: item.quantity || 1,
        total: ((item.price || 0) * (item.quantity || 1)).toFixed(2),
      }));

      // Calculate total
      const total = parseFloat(amount || store_amount || '0').toFixed(2);

      // Create order
      const orderData: any = {
        status: 'processing',
        currency: currency || 'BDT',
        customer_id: customerId,
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
        transaction_id: bank_tran_id || val_id,
        meta_data: [
          {
            key: '_sslcommerz_tran_id',
            value: tran_id,
          },
          {
            key: '_sslcommerz_val_id',
            value: val_id,
          },
          {
            key: '_sslcommerz_bank_tran_id',
            value: bank_tran_id || '',
          },
        ],
      };

      try {
        await woocommerce.post('orders', orderData);
      } catch (error: any) {
        console.error('Error creating SSL Commerz order:', error);
      }
    }

    // Return success response to SSL Commerz
    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Error processing SSL Commerz IPN:", error);
    return NextResponse.json(
      { error: error.message || "Error processing IPN" },
      { status: 500 }
    );
  }
}

