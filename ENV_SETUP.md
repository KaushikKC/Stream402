# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration (Required for production database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (Required for access tokens)
JWT_SECRET=your-secret-key-here

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Pinata IPFS Configuration (Optional - for IPFS uploads)
PINATA_JWT=your-pinata-jwt-token

# Service Wallet (Required for NFT minting)
SERVICE_WALLET_PRIVATE_KEY=your-service-wallet-private-key-base58
```

## Quick Setup

1. **Create `.env.local` file:**
   ```bash
   touch .env.local
   ```

2. **Add your Supabase credentials:**
   - Get your Supabase URL and anon key from [supabase.com](https://supabase.com)
   - Add them to `.env.local`

3. **Add JWT Secret:**
   - Generate a random secret: `openssl rand -base64 32`
   - Add it to `.env.local` as `JWT_SECRET`

4. **Restart your dev server:**
   ```bash
   npm run dev
   ```

## Verification

After setting up environment variables, check the console logs when you start the server:

- ✅ `Supabase configured successfully` - Database will be used
- ⚠️ `Supabase credentials not found` - Will use local storage fallback

## Troubleshooting

**Issue:** Still using local storage even after adding Supabase vars
- **Fix:** Make sure the variable names are exactly `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Fix:** Restart your dev server after adding the variables
- **Fix:** Check that there are no typos or extra spaces in the `.env.local` file

**Issue:** Database errors
- **Fix:** Make sure you've run the SQL schema in Supabase (see `supabase-schema.sql`)
- **Fix:** Check that your Supabase project is active and accessible
- **Fix:** Verify your anon key has the correct permissions

