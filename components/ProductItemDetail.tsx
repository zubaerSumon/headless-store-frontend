"use client";

import { ShoppingBasket, LoaderCircle, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { isAuthenticated } from '@/lib/auth-utils';
import { toast } from 'sonner';

interface ProductItemDetailProps {
  product: any;
}

function ProductItemDetail({ product }: ProductItemDetailProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const isAuth = isAuthenticated();

  // WooCommerce product data structure
  // WooCommerce products have: id, name, price, regular_price, sale_price, images[], description, categories[]
  const productId = product.id;
  const productName = product.name || "Product";
  const productDescription = product.description || "";
  
  // Handle WooCommerce pricing (sale_price vs regular_price)
  // WooCommerce uses sale_price for discounted price, regular_price for original price
  const salePrice = product.sale_price && product.sale_price !== "" 
    ? parseFloat(product.sale_price) 
    : null;
  const regularPrice = product.regular_price 
    ? parseFloat(product.regular_price) 
    : parseFloat(product.price || "0");
  const hasSale = salePrice !== null && salePrice < regularPrice;
  const productPrice = hasSale ? salePrice : regularPrice;
  
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // WooCommerce images structure: images is an array of objects with src, alt properties
  const productImage = product.images?.[0]?.src || "/product-placeholder.jpeg";
  const productImageAlt = product.images?.[0]?.alt || productName;
  
  const totalPrice = (quantity * productPrice).toFixed(2);

  const addToCart = () => {
    setLoading(true);
    
    if (!isAuth) {
      router.push('/login');
      setLoading(false);
      return;
    }

    // Prepare item for cart (WooCommerce structure)
    const itemToAdd = {
      id: String(productId),
      name: productName,
      price: productPrice,
      image: product.images?.[0] || { src: "/product-placeholder.jpeg", alt: productName },
      quantity: 1, // addItem will handle incrementing if item exists
    };

    // Add the item quantity times
    // Note: addItem adds one at a time, so we call it multiple times for quantity > 1
    for (let i = 0; i < quantity; i++) {
      addItem(itemToAdd);
    }

    setLoading(false);
    toast.success('Added to Cart');
    // Dialog will close automatically when clicking outside or close button
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 p-7 bg-white text-black rounded-lg'>
      {/* Image */}
      <Image
        src={productImage}
        alt={productImageAlt}
        width={300}
        height={300}
        className='bg-slate-200 p-5 h-[320px] w-[300px] object-contain rounded-lg'
      />

      {/* Information */}
      <div className='flex flex-col gap-3'>
        <h2 className='text-2xl font-bold'>{productName}</h2>
        {productDescription && (
          <div 
            className='text-sm text-gray-500' 
            dangerouslySetInnerHTML={{ __html: String(productDescription) }} 
          />
        )}
        <div className='flex gap-3'>
          {hasSale && salePrice !== null && (
            <h2 className='font-bold text-3xl'>${salePrice.toFixed(2)}</h2>
          )}
          <h2 className={`font-bold text-3xl ${hasSale ? 'line-through text-gray-500' : ''}`}>
            ${regularPrice.toFixed(2)}
          </h2>
        </div>
        <h2 className='font-medium text-lg'>Quantity</h2>
        <div className='flex flex-col items-baseline gap-3'>
          <div className='flex gap-3 items-center'>
            <div className='p-2 border flex gap-10 items-center px-5'>
              <button
                disabled={quantity === 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="disabled:opacity-50 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <h2 className="w-8 text-center">{quantity}</h2>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <h2 className='text-2xl font-bold'> = ${totalPrice}</h2>
          </div>
          <Button
            disabled={loading}
            className="flex gap-3 bg-[#31B65D] hover:bg-[#31B65D]/90 text-white"
            onClick={addToCart}
          >
            <ShoppingBasket />
            {loading ? (
              <>
                <LoaderCircle className='animate-spin' />
                Adding...
              </>
            ) : (
              'Add To Cart'
            )}
          </Button>
        </div>
        {product.categories && product.categories.length > 0 && (
          <h2 className='text-sm text-gray-600'>
            <span className='font-bold'>Category:</span>{' '}
            {product.categories.map((cat: any) => cat.name || cat.slug).join(', ')}
          </h2>
        )}
      </div>
    </div>
  );
}

export default ProductItemDetail;
