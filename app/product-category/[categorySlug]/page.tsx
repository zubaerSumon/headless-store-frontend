import { getProductsByCategory } from "@/actions/products";
import { getCategories } from "@/actions/categories";
import { getCategoryBySlug } from "@/actions/categories";
import TopCategoryList from "@/components/TopCategoryList";
import ProductList from "@/components/ProductList";

type Props = {
  params: Promise<{
    categorySlug: string;
  }>;
};

async function ProductCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  
  const [productList, categoryList, category] = await Promise.all([
    getProductsByCategory(categorySlug),
    getCategories(),
    getCategoryBySlug(categorySlug),
  ]);

  const categoryName = category?.name || categorySlug;

  return (
    <div>
      <h2 className='bg-primary text-white p-4 font-bold text-3xl text-center'>
        {categoryName}
      </h2>
      <TopCategoryList categoryList={categoryList} selectedCategory={categorySlug} />

      <div className='p-5 md:p-10'>
        {productList && productList.length > 0 ? (
          <ProductList productList={productList} />
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCategoryPage;

