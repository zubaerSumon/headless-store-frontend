'use server';

import WooCommerceRestApi from 'woocommerce-rest-ts-api';

const woocommerce = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_STORE_URL || '',
  consumerKey: process.env.WC_CONSUMER_KEY as string,
  consumerSecret: process.env.WC_CONSUMER_SECRET as string,
  version: 'wc/v3',
});

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  error?: string;
}

interface RegisterResponse {
  success: boolean;
  customer?: {
    id: number;
    username: string;
    email: string;
  };
  error?: string;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const storeUrl = process.env.NEXT_PUBLIC_WC_STORE_URL || '';
    
    if (!storeUrl) {
      return {
        success: false,
        error: 'Store URL is not configured.',
      };
    }

    // Try JWT Authentication first (if JWT Auth plugin is installed)
    try {
      const jwtResponse = await fetch(`${storeUrl}/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const jwtData = await jwtResponse.json();

      if (jwtResponse.ok && jwtData.token) {
        // Try to get user ID from JWT token or make an API call
        let userId = 0;
        
        // Try to decode JWT token to get user ID (simple base64 decode of payload)
        try {
          const tokenParts = jwtData.token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            userId = payload?.data?.user?.id || payload?.user?.id || 0;
          }
        } catch (e) {
          // If decoding fails, try to get user ID from WordPress API
        }

        // If we still don't have user ID, try to get it from WordPress API
        if (!userId) {
          try {
            const userResponse = await fetch(`${storeUrl}/wp-json/wp/v2/users/me`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${jwtData.token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              userId = userData.id || 0;
            }
          } catch (e) {
            // If this fails, userId will remain 0
          }
        }

        // Success response format: { token, user_display_name, user_email, user_nicename }
        return {
          success: true,
          token: jwtData.token,
          user: {
            id: userId,
            username: jwtData.user_nicename || credentials.username,
            email: jwtData.user_email || '',
          },
        };
      } else {
        // Error response format: { code: "jwt_auth_failed", message: "Invalid Credentials." }
        const errorMsg = jwtData.message || 'Invalid credentials.';
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (jwtError: any) {
      // JWT endpoint not available or network error, continue to next method
      // Only fall through if it's a network/connection error, not an auth error
      if (jwtError?.response) {
        // If we got a response but it wasn't ok, return the error
        return {
          success: false,
          error: jwtError.message || 'Authentication failed.',
        };
      }
      // Otherwise, continue to fallback methods
    }

    // Fallback: Try WordPress Application Password authentication
    // This requires the user to have an application password set up
    try {
      const appPasswordResponse = await fetch(`${storeUrl}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });

      if (appPasswordResponse.ok) {
        const userData = await appPasswordResponse.json();
        return {
          success: true,
          user: {
            id: userData.id,
            username: userData.name || userData.slug,
            email: userData.email,
          },
        };
      }
    } catch (appPasswordError) {
      // Application password not available, continue
    }

    // Final fallback: Try WordPress login endpoint (nonce-based)
    // Note: This is less secure and may require additional setup
    return {
      success: false,
      error: 'Invalid credentials. Please check your username and password. If you continue to have issues, ensure JWT Authentication plugin is installed or application passwords are enabled.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred during login. Please try again.',
    };
  }
}

export async function register(credentials: RegisterCredentials): Promise<RegisterResponse> {
  try {
    const storeUrl = process.env.NEXT_PUBLIC_WC_STORE_URL || '';
    
    if (!storeUrl) {
      return {
        success: false,
        error: 'Store URL is not configured.',
      };
    }

    // Use WooCommerce REST API to create a customer
    try {
      const response = await woocommerce.post('customers', {
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
      });

      if (response.data && response.data.id) {
        return {
          success: true,
          customer: {
            id: response.data.id,
            username: response.data.username || credentials.username,
            email: response.data.email || credentials.email,
          },
        };
      }
    } catch (wcError: any) {
      // WooCommerce API error
      const errorMessage = wcError?.response?.data?.message || 
                          wcError?.message || 
                          'Failed to create account. Please try again.';
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: false,
      error: 'Failed to create account. Please try again.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An error occurred during registration. Please try again.',
    };
  }
}

