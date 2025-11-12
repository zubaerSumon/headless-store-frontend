"use client";

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface TopCategoryListProps {
  categoryList: any[];
  selectedCategory?: string;
}

function TopCategoryList({ categoryList, selectedCategory }: TopCategoryListProps) {
  // Filter out "Uncategorized" category
  const filteredCategories = categoryList?.filter((category) => 
    category.slug !== 'uncategorized' && 
    category.name?.toLowerCase() !== 'uncategorized'
  ) || [];

  if (!filteredCategories || filteredCategories.length === 0) {
    return null;
  }

  return (
    <div className='scrollShape flex gap-5 mt-2 overflow-auto mx-7 md:mx-20 justify-center'>
      {filteredCategories.map((category) => {
        const isSelected = selectedCategory === category.slug || selectedCategory === category.name;
        return (
          <Link
            key={category.id}
            href={`/product-category/${category.slug}`}
            className={`flex flex-col w-[150px] min-w-[100px] items-center bg-green-50 gap-2 p-3 rounded-lg group cursor-pointer hover:bg-green-600 transition-colors ${
              isSelected ? "bg-green-600 text-white" : ""
            }`}
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
            <h2 className={`text-green-800 group-hover:text-white text-sm text-center ${
              isSelected ? "text-white" : ""
            }`}>
              {category.name}
            </h2>
          </Link>
        );
      })}
    </div>
  );
}

export default TopCategoryList;

