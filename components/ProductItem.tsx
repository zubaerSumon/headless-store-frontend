"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductItemDetail from "./ProductItemDetail";

interface ProductItemProps {
  product: any;
}

function ProductItem({ product }: ProductItemProps) {
  // Get product image
  const productImage =
    product.images?.[0]?.src ||
    product.image?.src ||
    "/product-placeholder.jpeg";
  const productName = product.name || "Product";
  const productId = product.id;

  // Handle WooCommerce pricing (sale_price vs regular_price)
  const salePrice = product.sale_price || product.price;
  const regularPrice = product.regular_price || product.price;
  const hasSale =
    product.sale_price &&
    parseFloat(product.sale_price) < parseFloat(regularPrice);

  return (
    <div className="p-2 md:p-6 flex flex-col items-center justify-center gap-3 border rounded-lg hover:scale-105 hover:shadow-md transition-all ease-in-out">
      <Link 
        href={`/product/${productId}`}
        className="flex flex-col items-center gap-3 w-full cursor-pointer"
      >
        <Image
          src={productImage}
          width={500}
          height={200}
          alt={productName}
          className="h-[200px] w-[200px] object-contain"
        />
        <h2 className="font-bold text-lg">{productName}</h2>
        <div className="flex gap-3 items-center">
          {hasSale && <h2 className="font-bold text-lg">${salePrice}</h2>}
          <h2
            className={`font-bold text-lg ${
              hasSale ? "line-through text-gray-500" : ""
            }`}
          >
            ${regularPrice}
          </h2>
        </div>
      </Link>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="text-[#31B65D] hover:text-white hover:bg-[#31B65D] border-[#31B65D]"
            onClick={(e) => e.stopPropagation()}
          >
            Add to cart
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-3xl sm:max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{productName}</DialogTitle>
          <ProductItemDetail product={product} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductItem;
