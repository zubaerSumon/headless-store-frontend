"use client";
import React, { useState, useEffect } from "react";
import { X, MoreVertical, ShoppingCart, Minus, Plus } from "lucide-react";
import { navbarData } from "@/lib/data";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import Image from "next/image";
import Checkout from "./Checkout";
import LogoutButton from "./LogoutButton";
import { Button } from "./ui/button";

type Props = { products: any[] };

const ProductGrid = ({ products }: Props) => {
  const [toggle, setToggle] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const {
    isOpen,
    setIsOpen,
    items: cartItems,
    updateQuantity,
    removeItem: removeFromCart,
    cartTotal,
  } = useCart();

  useEffect(() => {
    // Check if user is authenticated
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    }
  }, []);

  return (
    <div className={`min-h-screen bg-white`}>
      <header className={`sticky top-0 z-10 bg-white`}>
        <div
          className={`container mx-auto px-4 py-4 flex justify-between items-center`}
        >
          <div className="flex items-center gap-4">
            <button className={`p-2`} onClick={() => setToggle(!toggle)}>
              {toggle ? (
                <X className={`w-6 h-6 font-bold`} />
              ) : (
                <MoreVertical className={`w-6 h-6`} />
              )}
              <span className={`sr-only`}>Menu</span>
            </button>
            {toggle && (
              <div className={`flex gap-x-10 items-center `}>
                {navbarData.map((item) => (
                  <Link key={item.idx} href={item.href}>
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/account">
                  <Button variant="outline" size="sm">
                    Account
                  </Button>
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
              <button className={`text-lg font-medium flex items-center gap-2`}>
                <ShoppingCart className={`w-6 h-6`} />
                <span className={`sr-only`}>Cart</span>
                {cartItems.length > 0 && (
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-black text-white`}
                  >
                    {cartItems.reduce(
                      (total, item) => total + item.quantity,
                      0
                    )}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md ">
              <SheetHeader>
                <SheetTitle>Your Cart</SheetTitle>
              </SheetHeader>
              {cartItems.length === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center h-[50vh]`}
                >
                  <ShoppingCart className={`w-12 h-12 text-gray-300 mb-4`} />
                  <p className={` text-gray-500`}>Your cart is empty</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-auto p-6">
                    <ul className="space-y-6">
                      {cartItems.map((item) => (
                        <li key={item.id} className="flex gap-4">
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
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>{item.name}</h3>
                              <p className="ml-4">${item.price}</p>
                            </div>
                            <div className="flex items-center mt-2">
                              <button
                                className="rounded-md border p-1"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="mx-2 w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                className="rounded-md border p-1"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              className="rounded-md border p-1"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="w-5 h-5" />
                              <span className="sr-only">Remove</span>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-gray-200 p-6 mt-auto">
                      <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                        <p>Subtotal</p>
                        <p>${cartTotal}</p>
                      </div>
                      <Checkout/>
                    </div>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-40">
          {products.map((product, index) => (
            <Link
              key={index}
              href={`/product/${product.id}`}
              className="flex flex-col group relative"
            >
              <div>
                <Image
                  src={product.image?.src || "/product-placeholder.jpeg"}
                  alt={product.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="group-hover:opacity-100 opacity-0 flex flex-col justify-end ">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-semibold text-primary">
                    {product.name}
                  </h3>
                  <p className="text-base font-semibold text-primary">
                    ${product.price}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ProductGrid;
