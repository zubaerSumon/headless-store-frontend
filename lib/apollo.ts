// lib/apollo.ts
import { ApolloClient, InMemoryCache, DocumentNode } from "@apollo/client";
import { HttpLink } from "@apollo/client/link/http";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  // Ensure requests are sent even if the user isn't logged in (for public data)
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache', 
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  }
});

/**
 * Reusable utility function to fetch GraphQL data
 * @param query - The GraphQL query (DocumentNode)
 * @returns The GraphQL response data
 */
export async function fetchAPI(query: DocumentNode) {
  try {
    const result = await client.query({
      query,
      errorPolicy: 'all',
    });
    
    // Log the full result for debugging
    console.log("Apollo Query Result:", {
      data: result.data,
      error: result.error,
    });
    
    if (result.error) {
      console.error("GraphQL Error:", result.error);
    }
    
    return result.data;
  } catch (error: any) {
    console.error("GraphQL Fetch Error Details:", {
      message: error?.message,
      graphQLErrors: error?.graphQLErrors,
      networkError: error?.networkError,
      error,
    });
    throw error;
  }
}

