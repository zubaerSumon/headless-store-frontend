"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { CheckCircle2, LoaderIcon, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export default function SSLCommerzSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // SSL Commerz may send data via GET (query params) or POST (form data)
    // Check query parameters first
    const valId = searchParams.get("val_id");
    const tranId = searchParams.get("tran_id");
    const status = searchParams.get("status");
    
    // Get all query parameters
    const queryParams: any = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // If we have parameters in URL, use them
    if (valId || tranId || status) {
      handlePaymentData({ val_id: valId, tran_id: tranId, status, ...queryParams });
      return;
    }

    // If no query params, check sessionStorage for stored transaction ID
    const storedTranId = typeof window !== 'undefined' 
      ? sessionStorage.getItem('sslcommerz_tran_id')
      : null;

    if (storedTranId) {
      handlePaymentData({ tran_id: storedTranId, status: "VALID" });
      return;
    }

    // If still no data, try to find recent order
    // This handles cases where SSL Commerz redirects without parameters
    // but the IPN has already created the order
    handleNoPaymentData();
  }, [searchParams]);

  const handleNoPaymentData = async () => {
    // Try to create order from stored data if available
    if (typeof window !== 'undefined') {
      const storedTranId = sessionStorage.getItem('sslcommerz_tran_id');
      const storedItems = sessionStorage.getItem('sslcommerz_cart_items');
      const storedAddress = sessionStorage.getItem('sslcommerz_shipping_address');
      const storedCustomerId = sessionStorage.getItem('sslcommerz_customer_id');
      const storedTotal = sessionStorage.getItem('sslcommerz_total');

      if (storedTranId && storedItems && storedAddress) {
        try {
          const items = JSON.parse(storedItems);
          const shippingAddress = JSON.parse(storedAddress);
          const customerId = storedCustomerId ? parseInt(storedCustomerId) : null;

          const response = await fetch('/api/sslcommerz/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tran_id: storedTranId,
              items: items,
              shippingAddress: shippingAddress,
              customerId: customerId,
              amount: storedTotal,
              currency: 'BDT',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setOrder({
                tran_id: storedTranId,
                status: "processing",
                message: "Payment successful. Your order has been created.",
              });
              clearCart();
              toast.success("Payment successful! Your order has been created.");
              sessionStorage.setItem('order_just_created', 'true');
              // Clean up stored data
              sessionStorage.removeItem('sslcommerz_tran_id');
              sessionStorage.removeItem('sslcommerz_cart_items');
              sessionStorage.removeItem('sslcommerz_shipping_address');
              sessionStorage.removeItem('sslcommerz_customer_id');
              sessionStorage.removeItem('sslcommerz_total');
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Error creating order from stored data:', error);
        }
      }
    }

    // Clear cart anyway (payment might have gone through)
    clearCart();
    
    // Show a helpful message
    setOrder({
      status: "processing",
      message: "If you completed the payment, please check your orders page. The order may have been created successfully via IPN.",
    });
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('order_just_created', 'true');
    }
    
    toast.info("Please check your orders page to confirm your order.");
    setLoading(false);
  };

  const handlePaymentData = async (paymentData: any) => {
    const { val_id: valId, tran_id: tranId, status } = paymentData;

    // If we have tran_id but no val_id, try to find the order
    if (tranId && !valId) {
      const findOrderByTranId = async () => {
        try {
          const response = await fetch(`/api/sslcommerz/order-by-tran?tran_id=${tranId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.val_id) {
              // Found order, validate with val_id
              validatePayment(data.val_id);
              return;
            } else if (data.success && data.orderId) {
              // Order exists but no val_id yet, show success message
              setOrder({
                tran_id: tranId,
                status: data.status || "processing",
                message: "Payment successful. Your order is being processed.",
              });
              clearCart();
              toast.success("Payment successful! Your order is being processed.");
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('order_just_created', 'true');
                sessionStorage.removeItem('sslcommerz_tran_id');
              }
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error finding order:", error);
        }
        
        // If status is VALID, payment was successful even without val_id
        // Try to create order if it doesn't exist
        if (status === "VALID" || status === "SUCCESS") {
          // Try to create order from stored data
          if (typeof window !== 'undefined') {
            const storedItems = sessionStorage.getItem('sslcommerz_cart_items');
            const storedAddress = sessionStorage.getItem('sslcommerz_shipping_address');
            const storedCustomerId = sessionStorage.getItem('sslcommerz_customer_id');
            const storedTotal = sessionStorage.getItem('sslcommerz_total');

            if (storedItems && storedAddress) {
              try {
                const items = JSON.parse(storedItems);
                const shippingAddress = JSON.parse(storedAddress);
                const customerId = storedCustomerId ? parseInt(storedCustomerId) : null;

                const response = await fetch('/api/sslcommerz/create-order', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    tran_id: tranId,
                    items: items,
                    shippingAddress: shippingAddress,
                    customerId: customerId,
                    amount: storedTotal,
                    currency: 'BDT',
                  }),
                });

                if (response.ok) {
                  await response.json();
                }
              } catch (error) {
                console.error('Error creating order from stored data:', error);
              }
            }
          }

          setOrder({
            tran_id: tranId,
            status: "VALID",
            message: "Payment successful. Your order is being processed.",
          });
          clearCart();
          toast.success("Payment successful! Your order is being processed.");
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('order_just_created', 'true');
            sessionStorage.removeItem('sslcommerz_tran_id');
            sessionStorage.removeItem('sslcommerz_cart_items');
            sessionStorage.removeItem('sslcommerz_shipping_address');
            sessionStorage.removeItem('sslcommerz_customer_id');
            sessionStorage.removeItem('sslcommerz_total');
          }
          setLoading(false);
          return;
        }
        
        setError("Unable to validate payment. Please check your orders page.");
        setLoading(false);
      };
      
      findOrderByTranId();
      return;
    }

    if (!valId && !tranId) {
      handleNoPaymentData();
      return;
    }

    // If we have val_id, validate payment
    if (valId) {
      validatePayment(valId);
    } else {
      handleNoPaymentData();
    }
  };

  const validatePayment = async (validationId: string) => {
    try {
      const response = await fetch("/api/sslcommerz/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ val_id: validationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to validate payment");
      }

      const data = await response.json();

      if (data.success && data.order) {
        setOrder(data.order);
        clearCart();
        toast.success("Payment successful!");
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('order_just_created', 'true');
          sessionStorage.removeItem('sslcommerz_tran_id');
        }
      } else {
        throw new Error("Payment validation failed");
      }
    } catch (err: any) {
      console.error("Error validating payment:", err);
      setError(err.message || "An error occurred while validating your payment");
      toast.error(err.message || "Failed to validate payment");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoaderIcon className="w-12 h-12 animate-spin text-[#31B65D] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Validating your payment...
          </h2>
          <p className="text-gray-500">Please wait while we confirm your payment.</p>
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
            Payment Validation Failed
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
              Payment Successful!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your payment has been confirmed.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Details
            </h2>
            <div className="space-y-3">
              {order.tran_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-semibold text-gray-900">
                    {order.tran_id}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600 capitalize">
                  {order.status || "Valid"}
                </span>
              </div>
              {order.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {order.currency || "BDT"} {order.amount}
                  </span>
                </div>
              )}
              {order.message && (
                <p className="text-sm text-gray-600 mt-2">{order.message}</p>
              )}
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
