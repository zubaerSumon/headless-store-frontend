"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { CheckCircle2, LoaderIcon, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    // Handle order_id (for COD orders)
    if (orderId) {
      // For COD orders, we already have the order, just display it
      // Fetch order details if needed, or use the order from the redirect
      setLoading(false);
      // You can fetch order details here if needed
      return;
    }

    if (!sessionId) {
      setError("No session ID or order ID provided");
      setLoading(false);
      return;
    }

    // Check if we've already processed this session
    const processedKey = `order_processed_${sessionId}`;
    const processedOrder = typeof window !== 'undefined' 
      ? sessionStorage.getItem(processedKey) 
      : null;

    if (processedOrder) {
      try {
        const orderData = JSON.parse(processedOrder);
        setOrder(orderData);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing stored order:', error);
        // Continue to fetch order if parsing fails
      }
    }

    const confirmOrder = async () => {
      try {
        const response = await fetch("/api/order/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to confirm order");
        }

        const data = await response.json();
        
        if (data.success && data.order) {
          setOrder(data.order);
          
          // Store the processed order to prevent duplicate API calls
          if (typeof window !== 'undefined') {
            const processedKey = `order_processed_${sessionId}`;
            sessionStorage.setItem(processedKey, JSON.stringify(data.order));
            
            // Store a flag to refresh orders page
            sessionStorage.setItem('order_just_created', 'true');
          }
          
          // Always clear cart after successful order (even if order already existed)
          clearCart();
          
          if (!data.alreadyExists) {
            toast.success("Order confirmed successfully!");
          } else {
            toast.info("Order already processed");
          }
        } else {
          throw new Error("Order confirmation failed");
        }
      } catch (err: any) {
        console.error("Error confirming order:", err);
        setError(err.message || "An error occurred while confirming your order");
        toast.error(err.message || "Failed to confirm order");
      } finally {
        setLoading(false);
      }
    };

    confirmOrder();
  }, [sessionId, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoaderIcon className="w-12 h-12 animate-spin text-[#31B65D] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Confirming your order...
          </h2>
          <p className="text-gray-500">Please wait while we process your payment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Confirmation Failed
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push("/orders")}
              variant="outline"
            >
              View Orders
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="bg-[#31B65D] hover:bg-[#31B65D]/90 text-white"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle order_id case (COD orders)
  if (orderId && !sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-[#31B65D]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Placed!
              </h1>
              <p className="text-gray-600">
                Thank you for your purchase. Your order has been placed successfully.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-semibold text-gray-900">
                    #{orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-green-600 capitalize">
                    Cash on Delivery
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/orders">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <ShoppingBag className="mr-2 w-4 h-4" />
                  View All Orders
                </Button>
              </Link>
              <Link href="/">
                <Button
                  className="w-full sm:w-auto bg-[#31B65D] hover:bg-[#31B65D]/90 text-white"
                >
                  Continue Shopping
                </Button>
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              You will receive a confirmation email shortly. Please have cash ready for delivery.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-[#31B65D]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-semibold text-gray-900">
                  #{order.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Key:</span>
                <span className="font-semibold text-gray-900">
                  {order.order_key}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600 capitalize">
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-gray-900">
                  {order.currency} {order.total}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(order.date_created).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/orders">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ShoppingBag className="mr-2 w-4 h-4" />
                View All Orders
              </Button>
            </Link>
            <Link href="/">
              <Button
                className="w-full sm:w-auto bg-[#31B65D] hover:bg-[#31B65D]/90 text-white"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            A confirmation email has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}

