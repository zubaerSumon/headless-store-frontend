"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import Checkout from "@/components/Checkout";
import { isAuthenticated } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const {
    items: cartItems,
    updateQuantity,
    removeItem: removeFromCart,
    cartTotal,
  } = useCart();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAuth(isAuthenticated());
  }, []);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="text-center py-16">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Please Login to View Cart</h2>
        <p className="text-gray-500 mb-6">You need to be logged in to view your cart.</p>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-6">Add some products to your cart to get started.</p>
          <Link href="/">
            <Button>
              Continue Shopping
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-6 border-b last:border-b-0 last:pb-0"
                >
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={item.image?.src || "/product-placeholder.jpeg"}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">${item.price} each</p>
                      </div>
                      <button
                        className="rounded-md border p-1 hover:bg-gray-100 transition-colors"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="w-5 h-5" />
                        <span className="sr-only">Remove</span>
                      </button>
                    </div>
                    <div className="flex items-center mt-auto">
                      <div className="flex items-center border rounded-md">
                        <button
                          className="p-2 hover:bg-gray-100 transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          className="p-2 hover:bg-gray-100 transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="ml-auto">
                        <p className="text-lg font-bold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>${cartTotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${cartTotal}</span>
                </div>
              </div>
            </div>

            <Link href="/checkout" className="block">
              <Button className="w-full bg-[#31B65D] hover:bg-[#31B65D]/90 text-white">
                Proceed to Checkout
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            
            <Link href="/" className="block mt-4">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

