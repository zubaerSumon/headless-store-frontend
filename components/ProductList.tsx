import React from 'react';
import ProductItem from './ProductItem';

interface ProductListProps {
  productList: any[];
}

function ProductList({ productList }: ProductListProps) {
  if (!productList || productList.length === 0) {
    return null;
  }

  // Show first 8 products
  const displayProducts = productList.slice(0, 8);

  return (
    <div className='mt-10'>
      <h2 className='text-primary font-bold text-2xl'>Our Popular Products</h2>
      <div className='grid gap-5 mt-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
        {displayProducts.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default ProductList;

