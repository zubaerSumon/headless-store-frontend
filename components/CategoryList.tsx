import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface CategoryListProps {
  categoryList: any[];
}

function CategoryList({ categoryList }: CategoryListProps) {
  // Filter out "Uncategorized" category
  const filteredCategories = categoryList?.filter((category) => 
    category.slug !== 'uncategorized' && 
    category.name?.toLowerCase() !== 'uncategorized'
  ) || [];

  if (!filteredCategories || filteredCategories.length === 0) {
    return null;
  }

  return (
    <div className='mt-5'>
      <h2 className='text-primary font-bold text-2xl'>Shopping by Category</h2>
      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-5 mt-2'>
        {filteredCategories.map((category) => (
          <Link
            key={category.id}
            href={`/product-category/${category.slug}`}
            className='flex flex-col items-center bg-green-50 gap-2 p-3 rounded-lg group cursor-pointer hover:bg-green-600 transition-colors'
          >
            {category.image && (
              <Image
                src={category.image.src || "/product-placeholder.jpeg"}
                width={50}
                height={50}
                alt={category.name}
                className='group-hover:scale-125 transition-all ease-in-out object-contain'
              />
            )}
            <h2 className='text-green-800 group-hover:text-white text-sm text-center'>{category.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CategoryList;

