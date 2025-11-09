// app/page.js
import { gql } from '@apollo/client';
import { fetchAPI } from '../lib/apollo';

// Product type definition
interface Product {
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  image: {
    sourceUrl: string;
    altText: string | null;
  } | null;
}

// GraphQL response type
interface GetProductsResponse {
  products: {
    nodes: Product[];
  };
}

// Define the GraphQL query to fetch product details
const GET_PRODUCTS_QUERY = gql`
  query GetProducts {
    products(first: 100) {
      nodes {
        databaseId
        name
        slug
        description
        image {
          sourceUrl
          altText
        }
        ... on SimpleProduct {
          price(format: RAW)
        }
        ... on VariableProduct {
          price(format: RAW)
        }
        ... on ExternalProduct {
          price(format: RAW)
        }
        ... on GroupProduct {
          price(format: RAW)
        }
      }
    }
  }
`;

/**
 * Home page component (Server Component in Next.js App Router)
 */
export default async function Home() {
  let data: GetProductsResponse | null = null;
  let error: string | null = null;

  try {
    // Fetch data from the local WordPress GraphQL API
    const response = await fetchAPI(GET_PRODUCTS_QUERY);
    console.log("Full GraphQL Response:", response);
    console.log("Response type:", typeof response);
    console.log("Response keys:", response ? Object.keys(response) : 'null/undefined');
    
    if (response) {
      data = response as GetProductsResponse;
    } else {
      error = "GraphQL query returned undefined. Check server console for errors.";
    }
  } catch (e: any) {
    const errorMessage = e?.message || e?.graphQLErrors?.[0]?.message || 'Unknown error';
    error = errorMessage;
    console.error("Fetching Error:", e);
    if (e?.graphQLErrors) {
      console.error("GraphQL Errors:", e.graphQLErrors);
    }
    if (e?.networkError) {
      console.error("Network Error:", e.networkError);
    }
  }

  const products: Product[] = data?.products?.nodes || [];
  console.log("Extracted products:", products.length, products);

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🛒 Headless WooCommerce Store</h1>
      <p>API Endpoint: {process.env.NEXT_PUBLIC_WORDPRESS_API_URL}</p>
      <hr />

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {data && (
        <details style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug: Raw GraphQL Response</summary>
          <pre style={{ marginTop: '10px', overflow: 'auto', fontSize: '0.8em' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )}

      <h2>Products from GraphQL ({products.length})</h2>

      {products.length === 0 ? (
        <p>No published products found in WooCommerce. Check WordPress admin.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: '0' }}>
          {products.map((product) => (
            <li key={product.databaseId} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px', backgroundColor: '#fff' }}>
              <h3 style={{ marginTop: '0', marginBottom: '10px' }}>{product.name}</h3>
              
              {product.price && (
                <p style={{ fontWeight: 'bold', color: '#059669', fontSize: '1.2em', marginBottom: '10px' }}>
                  ${product.price}
                </p>
              )}

              {product.image && (
                <img 
                  src={product.image.sourceUrl} 
                  alt={product.image.altText || product.name}
                  style={{ maxWidth: '300px', height: 'auto', borderRadius: '4px', marginBottom: '15px' }}
                />
              )}

              {product.description && (
                <div 
                  dangerouslySetInnerHTML={{ __html: product.description }}
                  style={{ marginBottom: '15px', color: '#555', lineHeight: '1.6' }}
                />
              )}

              <p style={{ fontSize: '0.9em', color: '#888', marginBottom: '5px' }}>
                <strong>ID:</strong> {product.databaseId} | <strong>Slug:</strong> {product.slug}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}