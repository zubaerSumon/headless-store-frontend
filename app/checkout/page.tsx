"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import { isAuthenticated, getUser } from "@/lib/auth-utils";
import { CreditCard, Wallet, Truck, ArrowLeft, LoaderIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type PaymentMethod = "cod" | "stripe" | "sslcommerz";

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, cartTotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [customerId, setCustomerId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: "US",
  });

  useEffect(() => {
    setMounted(true);
    
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Load user data if available
    const user = getUser();
    if (user) {
      setCustomerId(user.id || null);
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
      }));
    }
  }, [router]);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <LoaderIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-[#31B65D]" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-6">Add some products to your cart to checkout.</p>
          <Link href="/">
            <Button className="bg-[#31B65D] hover:bg-[#31B65D]/90 text-white">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    if (!formData.address.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (!formData.state.trim()) {
      toast.error("State is required");
      return false;
    }
    if (!formData.postcode.trim()) {
      toast.error("Postcode is required");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === "cod") {
        // Handle Cash on Delivery
        await handleCashOnDelivery();
      } else if (paymentMethod === "stripe") {
        // Handle Stripe payment
        await handleStripePayment();
      } else if (paymentMethod === "sslcommerz") {
        // Handle SSL Commerz payment
        await handleSSLCommerzPayment();
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "An error occurred during checkout");
    } finally {
      setLoading(false);
    }
  };

  const handleCashOnDelivery = async () => {
    const response = await fetch("/api/order/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentMethod: "cod",
        shippingAddress: formData,
        items: cartItems,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create order");
    }

    const data = await response.json();
    
    if (data.success && data.order) {
      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/success?order_id=${data.order.id}&payment_method=cod`);
    } else {
      throw new Error(data.error || "Failed to create order");
    }
  };

  const handleStripePayment = async () => {
    // Redirect to Stripe checkout with address info
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        items: cartItems,
        shippingAddress: formData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create checkout session");
    }

    const data = await response.json();
    
    if (data.url) {
      window.location.href = data.url;
    } else if (data.sessionId) {
      window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
    }
  };

  const handleSSLCommerzPayment = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/sslcommerz/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems,
          shippingAddress: formData,
          totalAmount: cartTotal,
          customerId: customerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate SSL Commerz payment");
      }

      const data = await response.json();

      if (data.success && data.gatewayUrl) {
        // Store transaction ID and cart data for later use (in case SSL Commerz doesn't pass it back)
        if (data.tran_id && typeof window !== 'undefined') {
          sessionStorage.setItem('sslcommerz_tran_id', data.tran_id);
          // Store cart items and shipping address for order creation fallback
          sessionStorage.setItem('sslcommerz_cart_items', JSON.stringify(cartItems));
          sessionStorage.setItem('sslcommerz_shipping_address', JSON.stringify(formData));
          sessionStorage.setItem('sslcommerz_customer_id', customerId ? String(customerId) : '');
          sessionStorage.setItem('sslcommerz_total', String(cartTotal));
        }
        // Redirect to SSL Commerz payment page
        window.location.href = data.gatewayUrl;
      } else {
        throw new Error(data.error || "Failed to initiate payment");
      }
    } catch (error: any) {
      console.error("SSL Commerz payment error:", error);
      toast.error(error.message || "An error occurred during payment");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-[#31B65D] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  placeholder="Street address"
                />
              </div>

              <div>
                <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                <Input
                  id="address2"
                  name="address2"
                  value={formData.address2}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                className="space-y-4"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <RadioGroupItem value="cod" id="cod" className="mt-1" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-[#31B65D]" />
                      <div>
                        <div className="font-semibold">Cash on Delivery</div>
                        <div className="text-sm text-gray-500">Pay when you receive your order</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <RadioGroupItem value="stripe" id="stripe" className="mt-1" />
                  <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-[#31B65D]" />
                      <div>
                        <div className="font-semibold">Credit/Debit Card (Stripe)</div>
                        <div className="text-sm text-gray-500">Secure payment via Stripe</div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <RadioGroupItem value="sslcommerz" id="sslcommerz" className="mt-1" />
                  <Label htmlFor="sslcommerz" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-[#31B65D]" />
                      <div>
                        <div className="font-semibold">SSL Commerz</div>
                        <div className="text-sm text-gray-500">Pay via SSL Commerz gateway</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.image?.src || "/product-placeholder.jpeg"}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity} × ${item.price}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[#31B65D] hover:bg-[#31B65D]/90 text-white mt-6"
                size="lg"
              >
                {loading ? (
                  <>
                    <LoaderIcon className="mr-2 w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {paymentMethod === "cod" && "Place Order"}
                    {paymentMethod === "stripe" && "Proceed to Payment"}
                    {paymentMethod === "sslcommerz" && "Proceed to Payment"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

