import { NextResponse } from "next/server";
import crypto from "crypto";

const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const SSLCOMMERZ_STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD;
const SSLCOMMERZ_IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === "true";
const SSLCOMMERZ_BASE_URL = SSLCOMMERZ_IS_LIVE
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

export async function POST(req: Request) {
  try {
    const { val_id } = await req.json();

    if (!val_id) {
      return NextResponse.json(
        { error: "Validation ID is required" },
        { status: 400 }
      );
    }

    if (!SSLCOMMERZ_STORE_ID || !SSLCOMMERZ_STORE_PASSWORD) {
      return NextResponse.json(
        { error: "SSL Commerz credentials are not configured" },
        { status: 500 }
      );
    }

    // Validate transaction with SSL Commerz
    const validationData = {
      store_id: SSLCOMMERZ_STORE_ID,
      store_passwd: SSLCOMMERZ_STORE_PASSWORD,
      val_id: val_id,
      format: "json",
    };

    const response = await fetch(
      `${SSLCOMMERZ_BASE_URL}/validator/api/validationserverAPI.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(
          Object.entries(validationData).map(([key, value]) => [key, String(value)])
        ),
      }
    );

    const validationResult = await response.json();

    if (validationResult.status === "VALID" || validationResult.status === "VALIDATED") {
      return NextResponse.json({
        success: true,
        order: {
          tran_id: validationResult.tran_id,
          val_id: validationResult.val_id,
          amount: validationResult.amount,
          currency: validationResult.currency,
          status: validationResult.status,
        },
      });
    } else {
      return NextResponse.json(
        {
          error: validationResult.errorReason || "Payment validation failed",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error validating SSL Commerz payment:", error);
    return NextResponse.json(
      {
        error: error.message || "Error validating payment",
      },
      { status: 500 }
    );
  }
}

