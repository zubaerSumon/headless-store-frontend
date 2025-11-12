# SSL Commerz Payment Integration Setup

## Environment Variables Required

Add these to your `.env.local` file:

```env
# SSL Commerz Configuration
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false  # Set to "true" for production

# Make sure NEXT_PUBLIC_SITE_URL is set
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change for production
```

## Getting SSL Commerz Credentials

### For Testing (Sandbox):
1. Register at: https://developer.sslcommerz.com/registration/
2. Get your Store ID and Store Password from the dashboard
3. Set `SSLCOMMERZ_IS_LIVE=false`

### For Production:
1. Register at: https://signup.sslcommerz.com/register
2. Get your Store ID and Store Password from the dashboard
3. Set `SSLCOMMERZ_IS_LIVE=true`

## Test Cards (Sandbox Only)

- **VISA:** 4111111111111111
- **Mastercard:** 5111111111111111
- **American Express:** 371111111111111
- **Expiration Date:** 12/25
- **CVV:** 111

## How It Works

1. **Payment Initiation** (`/api/sslcommerz/initiate`):
   - Creates a payment session with SSL Commerz
   - Returns a gateway URL to redirect the user

2. **IPN Handler** (`/api/sslcommerz/ipn`):
   - Receives payment status updates from SSL Commerz
   - Creates WooCommerce order when payment is successful
   - Validates payment signature for security

3. **Payment Validation** (`/api/sslcommerz/validate`):
   - Validates the payment when user returns from SSL Commerz
   - Ensures payment authenticity

4. **Success/Fail/Cancel Pages**:
   - `/sslcommerz/success` - Payment successful
   - `/sslcommerz/fail` - Payment failed
   - `/sslcommerz/cancel` - Payment cancelled

## Flow

1. User fills checkout form and selects SSL Commerz
2. User clicks "Proceed to Payment"
3. System initiates payment with SSL Commerz
4. User is redirected to SSL Commerz payment page
5. User completes payment
6. SSL Commerz sends IPN to `/api/sslcommerz/ipn` (creates order)
7. User is redirected to success/fail/cancel page
8. Success page validates payment and shows confirmation

## Important Notes

- The IPN URL must be publicly accessible (not localhost)
- For local testing, use a service like ngrok to expose your local server
- Currency is set to "BDT" by default - change in `/api/sslcommerz/initiate/route.ts` if needed
- All payment data is validated using SHA-512 hash for security

