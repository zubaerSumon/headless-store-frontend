'use server';
import WooCommerceRestApi from 'woocommerce-rest-ts-api';

const woocommerce = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WC_STORE_URL || 'http://localhost/my-store/',
    consumerKey: process.env.WC_CONSUMER_KEY as string,
    consumerSecret: process.env.WC_CONSUMER_SECRET as string,
    version: 'wc/v3',
});

export const getCategories = async () => {
    try {
        const categories = await woocommerce.get('products/categories', { per_page: 100 });
        // Filter out "Uncategorized" category
        return categories.data.filter((category: any) => 
            category.slug !== 'uncategorized' && 
            category.name?.toLowerCase() !== 'uncategorized'
        );
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export const getCategoryBySlug = async (slug: string) => {
    try {
        const categories = await woocommerce.get('products/categories', { slug });
        return categories.data?.[0] || null;
    } catch (error) {
        console.error('Error fetching category:', error);
        return null;
    }
}

