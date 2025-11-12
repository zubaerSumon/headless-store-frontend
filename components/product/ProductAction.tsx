"use client";
import React, { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import Checkout from "../Checkout";
 type Props = {};

const ProductAction = (props: Props) => {
  const [mounted, setMounted] = useState(false);
  const { items: cartItems, cartTotal } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="rounded-lg bg-[#F4F4F5] p-6 sticky top-20 flex flex-col h-[80vh]">
      <div>
        <div className="grid grid-cols-3 gap-4 pb-2 border-b text-base font-medium">
          <div>Product</div>
          <div className="text-center">0</div>
          <div className="text-right">Price</div>
        </div>
        {/* Cart Items */}
        {mounted && cartItems.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-3 gap-4 text-base font-normal py-4"
          >
            <div>{item.name}</div>
            <div className="text-center">{item.quantity}</div>
            <div className="text-right">${item.price}</div>
          </div>
        ))}
      </div>
      {/* Sub Total */}
      <div className="mt-auto">
        <div className="flex justify-between items-center ">
          <div>Sub Total</div>
          <div className="text-right">${mounted ? (cartTotal || 0) : 0}</div>
        </div>
      </div>

      <Checkout  />
    </div>
  );
};

export default ProductAction;
