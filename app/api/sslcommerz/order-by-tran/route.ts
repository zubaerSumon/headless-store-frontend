import { NextResponse } from "next/server";
import WooCommerceRestApi from 'woocommerce-rest-ts-api';

const woocommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_STORE_URL || '',
  consumerKey: process.env.WC_CONSUMER_KEY as string,
  consumerSecret: process.env.WC_CONSUMER_SECRET as string,
  version: 'wc/v3',
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tranId = searchParams.get("tran_id");

    if (!tranId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Find order by transaction ID in metadata
    try {
      const recentOrders = await woocommerce.get('orders', {
        per_page: 50,
        orderby: 'date',
        order: 'desc',
      } as any);

      if (recentOrders.data) {
        for (const order of recentOrders.data) {
          if (order.meta_data && Array.isArray(order.meta_data)) {
            const tranIdMeta = order.meta_data.find(
              (meta: any) => meta.key === '_sslcommerz_tran_id' && meta.value === tranId
            );
            if (tranIdMeta) {
              // Get val_id from metadata
              const valIdMeta = order.meta_data.find(
                (meta: any) => meta.key === '_sslcommerz_val_id'
              );
              
              return NextResponse.json({
                success: true,
                orderId: order.id,
                val_id: valIdMeta?.value || null,
                tran_id: tranId,
                status: order.status,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error finding order:", error);
    }

    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error fetching order by transaction ID:", error);
    return NextResponse.json(
      {
        error: error.message || "Error fetching order",
      },
      { status: 500 }
    );
  }
}

