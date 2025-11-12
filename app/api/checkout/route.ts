import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
    })
  : null;

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable." },
        { status: 500 }
      );
    }

    const { items, shippingAddress } = await req.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid items: items array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate shipping address if provided
    if (shippingAddress) {
      if (!shippingAddress.address || !shippingAddress.phone) {
        return NextResponse.json(
          { error: "Address and phone number are required" },
          { status: 400 }
        );
      }
    }

    const lineItems = items.map((item: any) => {
      if (!item.name || !item.price || !item.quantity) {
        throw new Error(`Invalid item: missing required fields (name, price, or quantity)`);
      }
      return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image?.src ? [item.image.src] : [],
          metadata: {
            woocommerce_product_id: item.id || '',
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    };
    });
    
    // Store cart items in metadata for order creation
    const cartItemsMetadata = items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image?.src || '',
    }));
    
    // Prepare session options
    const sessionOptions: any = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        cart_items: JSON.stringify(cartItemsMetadata),
        shipping_address: JSON.stringify(shippingAddress || {}),
      },
    };

    // Add customer email if shipping address is provided
    if (shippingAddress?.email) {
      sessionOptions.customer_email = shippingAddress.email;
    }

    // Don't collect shipping address in Stripe if we already have it from the form
    // The address is stored in metadata and will be used when creating the order
    // Only collect if address is not provided
    if (!shippingAddress || !shippingAddress.address) {
      sessionOptions.shipping_address_collection = {
        allowed_countries: ['US'],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { 
        error: error.message || "Error creating checkout session",
        details: error.type || error.code || "Unknown error"
      },
      { status: 500 }
    );
  }
}
