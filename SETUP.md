# Setup Instructions

## 1. Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_RECIPIENT=your_solana_wallet_address_here
SOLANA_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# JWT Secret (IMPORTANT: Generate a secure random string)
# Option 1: Use openssl (recommended)
# Run: openssl rand -base64 32
# Option 2: Use Node.js
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET=your-generated-secret-here

# Pinata Configuration (for IPFS)
# Sign up for free at https://app.pinata.cloud/
# Get your JWT token from https://app.pinata.cloud/keys
# Free tier includes 1GB storage and 100 files
# You can use the public gateway or your own dedicated gateway
PINATA_JWT=your-pinata-jwt-token
PINATA_GATEWAY=gateway.pinata.cloud  # Optional: use your dedicated gateway if you have one

# Next.js Public Variables
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Generating JWT Secret

**Option 1: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Using Online Generator**
Visit: https://generate-secret.vercel.app/32

Copy the generated string and paste it as your `JWT_SECRET` value.

## 2. Install Dependencies

```bash
npm install
```

## 3. Run Development Server

```bash
npm run dev
```

## 4. Testing the Payment Flow

1. **Get USDC on DevNet:**
   - Visit: https://faucet.circle.com/
   - Enter your Solana wallet address
   - Request USDC test tokens

2. **Upload an Image:**
   - Go to `/upload`
   - Connect your wallet
   - Upload an image with price 0.01 USDC

3. **Access the Image:**
   - Go to `/images`
   - Click "Check access" on an image
   - Connect wallet if not connected
   - Click "Pay 0.01 USDC"
   - Approve transaction in wallet
   - Image should open after verification

## Troubleshooting

### Payment Verification Fails

If you get "Insufficient payment: received 0, required 10000":

1. **Check Transaction on Solana Explorer:**
   - Visit: https://explorer.solana.com/tx/{signature}?cluster=devnet
   - Replace `{signature}` with your transaction signature
   - Verify the transaction was successful
   - Check that USDC was transferred to the recipient address

2. **Verify Recipient Address:**
   - Make sure `SOLANA_RECIPIENT` in `.env.local` matches the recipient address used when uploading

3. **Check Token Mint:**
   - Ensure `SOLANA_USDC_MINT` is correct for devnet: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

4. **Check Server Logs:**
   - Look for debug logs in the terminal showing transaction details
   - The logs will show what token balances were found

### JWT Errors

If you get JWT-related errors:

1. **Check JWT_SECRET is set:**
   ```bash
   # In your .env.local file, make sure JWT_SECRET is set
   JWT_SECRET=your-secret-here
   ```

2. **Restart the dev server** after changing `.env.local`

3. **Verify JWT secret is not empty:**
   - The secret should be at least 32 characters long
   - Use a secure random string (see generation methods above)

### Wallet Connection Issues

1. **Install Phantom or Solflare:**
   - Phantom: https://phantom.app/
   - Solflare: https://solflare.com/

2. **Switch to DevNet:**
   - In Phantom: Settings → Developer Mode → Change Network to Devnet
   - In Solflare: Settings → Network → Devnet

3. **Get SOL for fees:**
   - Visit: https://faucet.solana.com/
   - Request SOL for transaction fees

## Production Setup

For production:

1. **Change to Mainnet:**
   ```bash
   SOLANA_NETWORK=mainnet-beta
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v  # Mainnet USDC
   ```

2. **Use a secure JWT secret:**
   - Generate a new secret using one of the methods above
   - Never commit secrets to git

3. **Use a production RPC endpoint:**
   - Consider using a paid RPC provider (Helius, QuickNode, etc.)
   - Free public RPCs have rate limits

4. **Use proper storage:**
   - Replace file system storage with IPFS or S3
   - Use a database (PostgreSQL, MongoDB) instead of JSON files

