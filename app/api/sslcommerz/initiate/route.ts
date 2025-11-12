import { NextResponse } from "next/server";
import crypto from "crypto";

// SSL Commerz configuration
const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const SSLCOMMERZ_STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD;
const SSLCOMMERZ_IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === "true";

// SSL Commerz API URLs
const SSLCOMMERZ_SANDBOX_URL = "https://sandbox.sslcommerz.com";
const SSLCOMMERZ_LIVE_URL = "https://securepay.sslcommerz.com";
const SSLCOMMERZ_BASE_URL = SSLCOMMERZ_IS_LIVE ? SSLCOMMERZ_LIVE_URL : SSLCOMMERZ_SANDBOX_URL;

export async function POST(req: Request) {
  try {
    if (!SSLCOMMERZ_STORE_ID || !SSLCOMMERZ_STORE_PASSWORD) {
      return NextResponse.json(
        { error: "SSL Commerz credentials are not configured" },
        { status: 500 }
      );
    }

    const { items, shippingAddress, totalAmount, customerId } = await req.json();

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

    if (!shippingAddress.address || !shippingAddress.phone) {
      return NextResponse.json(
        { error: "Address and phone number are required" },
        { status: 400 }
      );
    }

    // Generate unique transaction ID
    const tran_id = `TXN${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Calculate total amount
    const amount = totalAmount || items.reduce(
      (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    // Prepare payment data
    const paymentData: any = {
      store_id: SSLCOMMERZ_STORE_ID,
      store_passwd: SSLCOMMERZ_STORE_PASSWORD,
      total_amount: amount.toFixed(2),
      currency: process.env.SSLCOMMERZ_CURRENCY || "BDT", // Change to USD if needed
      tran_id: tran_id,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/sslcommerz/success`,
      fail_url: `${process.env.NEXT_PUBLIC_SITE_URL}/sslcommerz/fail`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/sslcommerz/cancel`,
      ipn_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/sslcommerz/ipn`,
      cus_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      cus_email: shippingAddress.email || "",
      cus_add1: shippingAddress.address || "",
      cus_add2: shippingAddress.address2 || "",
      cus_city: shippingAddress.city || "",
      cus_state: shippingAddress.state || "",
      cus_postcode: shippingAddress.postcode || "",
      cus_country: shippingAddress.country || "Bangladesh",
      cus_phone: shippingAddress.phone || "",
      shipping_method: "NO",
      product_name: items.map((item: any) => item.name).join(", "),
      product_category: "General",
      product_profile: "general",
      num_of_item: items.length,
      // Store cart items, shipping address, and customerId in value_a for later use
      value_a: JSON.stringify({
        items: items,
        shippingAddress: shippingAddress,
        customerId: customerId,
      }),
    };

    // Create hash for validation
    const hashString = `${SSLCOMMERZ_STORE_ID}${paymentData.success_url}${paymentData.fail_url}${paymentData.cancel_url}${paymentData.ipn_url}${paymentData.total_amount}${paymentData.currency}${paymentData.tran_id}${paymentData.product_profile}${SSLCOMMERZ_STORE_PASSWORD}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");
    paymentData.hash = hash;

    // Initiate payment with SSL Commerz
    const response = await fetch(`${SSLCOMMERZ_BASE_URL}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(
        Object.entries(paymentData).map(([key, value]) => [key, String(value)])
      ),
    });

    const responseText = await response.text();

    // Parse response (SSL Commerz returns URL-encoded or JSON)
    let sessionData: any = {};
    try {
      // Try to parse as JSON first
      sessionData = JSON.parse(responseText);
    } catch {
      // If not JSON, parse as URL-encoded
      const params = new URLSearchParams(responseText);
      params.forEach((value, key) => {
        sessionData[key] = value;
      });
    }

    if (sessionData.status === "SUCCESS" && sessionData.GatewayPageURL) {
      return NextResponse.json({
        success: true,
        sessionId: sessionData.sessionkey || tran_id,
        gatewayUrl: sessionData.GatewayPageURL,
        tran_id: tran_id,
      });
    } else {
      return NextResponse.json(
        {
          error: sessionData.failedreason || "Failed to initiate SSL Commerz payment",
          details: sessionData,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error initiating SSL Commerz payment:", error);
    return NextResponse.json(
      {
        error: error.message || "Error initiating SSL Commerz payment",
      },
      { status: 500 }
    );
  }
}

