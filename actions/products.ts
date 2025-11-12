'use server';
import WooCommerceRestApi from 'woocommerce-rest-ts-api';

const woocommerce = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WC_STORE_URL || 'http://localhost/my-store/',
    consumerKey: process.env.WC_CONSUMER_KEY as string,
    consumerSecret: process.env.WC_CONSUMER_SECRET as string,
    version: 'wc/v3',
});

export const getProducts = async () => {
    const products = await woocommerce.get('products');
    return products.data;
}

export const getProduct = async (id: string) => {
    const product = await woocommerce.get(`products`, {id:parseInt(id)});
    return product.data;
}

export const getFeaturedProducts = async () => {
    try {
        // Get featured products (products with featured flag or first few products)
        const products = await woocommerce.get('products', { featured: true, per_page: 5 });
        return products.data;
    } catch (error) {
        // Fallback: get first 5 products if featured filter doesn't work
        try {
            const products = await woocommerce.get('products', { per_page: 5 });
            return products.data;
        } catch (fallbackError) {
            console.error('Error fetching featured products:', fallbackError);
            return [];
        }
    }
}

export const getProductsByCategory = async (categorySlug: string) => {
    try {
        // First, get the category by slug to get its ID
        const categories = await woocommerce.get('products/categories', { slug: categorySlug });
        
        if (!categories.data || categories.data.length === 0) {
            return [];
        }
        
        const categoryId = categories.data[0].id;
        
        // Get products by category ID
        const products = await woocommerce.get('products', { category: categoryId });
        return products.data;
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return [];
    }
}

export const searchProducts = async (searchTerm: string) => {
    try {
        const products = await woocommerce.get('products', { search: searchTerm });
        return products.data;
    } catch (error) {
        console.error('Error searching products:', error);
        return [];
    }
}