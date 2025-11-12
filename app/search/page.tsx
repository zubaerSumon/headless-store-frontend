import { searchProducts } from "@/actions/products";
import ProductList from "@/components/ProductList";

type Props = {
  searchParams: Promise<{
    q?: string;
  }>;
};

async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const searchTerm = q || "";

  const productList = searchTerm ? await searchProducts(searchTerm) : [];

  return (
    <div className="p-5 md:p-10">
      <h2 className="text-2xl font-bold mb-6">
        {searchTerm ? `Search Results for "${searchTerm}"` : "Search Products"}
      </h2>
      {searchTerm ? (
        productList && productList.length > 0 ? (
          <ProductList productList={productList} />
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">No products found matching your search.</p>
          </div>
        )
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">Enter a search term to find products.</p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;

