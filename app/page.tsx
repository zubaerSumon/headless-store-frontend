import { getProducts, getFeaturedProducts } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import Slider from "@/components/Slider";
import CategoryList from "@/components/CategoryList";
import ProductList from "@/components/ProductList";
import Image from 'next/image';

export default async function Home() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
    // getFeaturedProducts(), // Commented out - using static carousel images instead
  ]);

  return (
    <div className="p-10 px-4 md:px-16 overflow-hidden">
      {/* Sliders */}
      <Slider />

      {/* CategoryList */}
      <CategoryList categoryList={categories} />

      {/* Product List */}
      <ProductList productList={products} />

      {/* Banner */}
      <Image
        src="/banner.png"
        width={1000}
        height={300}
        alt="banner"
        className="w-full h-[400px] object-contain mt-10"
      />
    </div>
  );
}
