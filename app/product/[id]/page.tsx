import { getProduct, getProducts } from "@/actions/products";
import Link from "next/link";
import Image from "next/image";
import ProductQuantity from "@/components/product/ProductQuantity";
import ProductAction from "@/components/product/ProductAction";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const ProductPage = async ({ params }: Props) => {
  const { id } = await params;
  const product = await getProduct(id);
  
  // Handle WooCommerce pricing (sale_price vs regular_price)
  const salePrice = product.sale_price || product.price;
  const regularPrice = product.regular_price || product.price;
  const hasSale = product.sale_price && parseFloat(product.sale_price) < parseFloat(regularPrice);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center text-lg font-medium mb-6 hover:text-primary transition-colors"
        >
          ← Back to Products
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="aspect-auto flex justify-center items-center h-[80vh] overflow-hidden rounded-lg bg-white p-8 shadow-sm">
              <Image
                src={product.images?.[0]?.src || "/product-placeholder.jpeg"}
                alt={product.images?.[0]?.alt || product.name}
                width={600}
                height={600}
                className="max-w-full max-h-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center gap-3">
                  {hasSale && (
                    <span className="text-2xl font-bold text-primary">${salePrice}</span>
                  )}
                  <span className={`text-2xl font-bold ${hasSale ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    ${regularPrice}
                  </span>
                </div>
              </div>
              <ProductQuantity product={product} />
              {product.description && (
                <div
                  className="text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: String(product.description),
                  }}
                />
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <ProductAction />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
