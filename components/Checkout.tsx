"use client";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-utils";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

type Props = {};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const Checkout = (props: Props) => {
  const [mounted, setMounted] = useState(false);
  const { items } = useCart();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const onCheckout = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated()) {
        toast.error("Please login to proceed with checkout");
        router.push("/login");
        return;
      }

      if (items.length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` (${errorData.details})`;
          }
        } catch {
          // If response is not JSON, try text
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.sessionId && !data.url) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout using the session URL
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Fallback: construct URL from session ID
        const stripe = await stripePromise;
        if (stripe) {
          // Use the session ID to redirect (if URL is not provided)
          window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
        } else {
          throw new Error("Stripe failed to initialize");
        }
      }
    } catch (error: any) {
      console.error("Error checking out:", error);
      toast.error(error.message || "An error occurred during checkout");
    } finally {
      setLoading(false);
    }
  };

  const itemsLength = mounted ? items.length : 0;

  return (
    <div className="grid gap-4">
      <Button
        size="lg"
        className="w-full"
        disabled={loading || itemsLength === 0}
        onClick={onCheckout}
      >
        {loading ? (
          <>
            <ShoppingBag className="mr-2 w-4 h-4 animate-pulse" />
            Processing...
          </>
        ) : (
          <>
            <ShoppingBag className="mr-2 w-4 h-4" />
            Proceed to Checkout
          </>
        )}
      </Button>
      {mounted && itemsLength === 0 && (
        <p className="text-sm text-gray-500 text-center">
          Add items to your cart to checkout
        </p>
      )}
    </div>
  );
};

export default Checkout;
