"use client";
import { useCart } from "@/hooks/use-cart";
import React from "react";

type Props = {
  product: any;
};

const ProductQuantity = ({ product }: Props) => {
  const { items: cartItems, updateQuantity, addItem: addToCart } = useCart();
  const currProductQuantity =
    cartItems.find((item: any) => item.id === product.id)?.quantity || 0;
const handleProduct = (quantity: number) => {
    const foundProduct = cartItems.find((item: any) => item.id === product.id);
    if(foundProduct){
        updateQuantity(product.id, quantity);
    }else{
        addToCart(product);   
    }
    updateQuantity(product.id, quantity);
}
  return (
    <div className="flex items-center space-x-6 justify-center">
      {[...Array(10)].map((_, i) => (
        <span
          key={i + 1}
          className={`inline-flex items-center justify-center font-medium rounded-md   hover:bg-gray-100 cursor-pointer ${
            currProductQuantity === i + 1 ? "bg-gray-100" : " "
          }`}
          onClick={() => handleProduct(i + 1)}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
};

export default ProductQuantity;
