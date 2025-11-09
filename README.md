# X402 Solana Image Payment App

**A Next.js app implementing the X402 payment protocol for image access using Solana DevNet.**

This app demonstrates a complete implementation of the X402 payment protocol where users can upload images and access them by paying with USDC on Solana DevNet.

## Features

- **Image Upload** - Providers can upload images with custom pricing
- **HTTP 402 Payment Challenge** - Server returns 402 with payment requirements
- **Solana Wallet Integration** - Connect Phantom or Solflare wallets
- **SPL Token Payments** - Pay with USDC on Solana DevNet
- **On-Chain Verification** - Payments verified directly on Solana blockchain
- **Time-Limited Access** - JWT tokens provide temporary access to images
- **Full Payment Flow** - Complete x402 implementation from challenge to verification

## Project Structure

```
img402/
├── app/
│   ├── api/
│   │   ├── upload/              # POST - Upload images
│   │   ├── asset/[id]/           # GET - Asset access (returns 402 if not paid)
│   │   ├── receipt/              # POST - Verify payment and get access token
│   │   ├── full/[id]/            # GET - Download full image (requires auth)
│   │   ├── images/list/          # GET - List all images
│   │   └── thumb/[id]/           # GET - Get thumbnail
│   ├── images/                   # Image gallery with payment flow
│   ├── upload/                   # Image upload page
│   └── page.tsx               # Home page
├── components/
│   └── solana/
│       └── solana-provider.tsx   # Solana wallet provider
├── lib/
│   ├── solana-config.ts          # Solana configuration
│   ├── jwt.ts                    # JWT utilities
│   ├── payment-verification.ts   # Payment verification logic
│   └── storage.ts                # Asset and payment storage
└── uploads/                      # Uploaded images (gitignored)
└── data/                         # Asset and payment metadata (gitignored)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- A Solana wallet (Phantom or Solflare)
- USDC on Solana DevNet (for testing)

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create a `.env.local` file:

```bash
# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_RECIPIENT=your_solana_wallet_address_here
SOLANA_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# JWT Secret (change in production!)
JWT_SECRET=your-secret-key-change-in-production

# Next.js Public Variables
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

3. **Run the development server:**

```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)**

## How It Works

### 1. Image Upload Flow

1. Provider navigates to `/upload`
2. Connects Solana wallet
3. Uploads image with title and price
4. Image is stored locally and metadata is saved
5. Asset ID is generated and returned

### 2. Payment Flow (X402 Protocol)

1. **Client requests image:** `GET /api/asset/:assetId`
2. **Server responds with 402:**
   ```json
   {
     "error": "Payment Required",
     "paymentRequest": {
       "imageId": "...",
       "network": "solana:devnet",
       "currency": "USDC",
       "decimals": 6,
       "amount": 10000,
       "mint": "...",
       "recipient": "..."
     },
     "paymentRequestToken": "..."
   }
   ```
3. **Client constructs payment:**
   - Creates SPL token transfer transaction
   - Transfers USDC to recipient address
   - Signs and sends transaction
4. **Client submits receipt:** `POST /api/receipt`
   - Sends transaction signature
   - Server verifies payment on-chain
   - Server returns JWT access token
5. **Client accesses image:**
   - Retries `GET /api/asset/:assetId` with `Authorization: Bearer <token>`
   - Server returns download URL
   - Client can download full image

### 3. Payment Verification

The server verifies payments by:

1. Fetching transaction from Solana blockchain
2. Checking transaction status (confirmed, no errors)
3. Verifying token transfer amount
4. Confirming recipient address matches
5. Validating transfer amount meets requirement

## API Endpoints

### POST /api/upload

Upload an image.

**Request:**
- `file`: Image file (multipart/form-data)
- `title`: Image title (optional)
- `price`: Price in USDC (e.g., "0.01")
- `recipient`: Recipient wallet address (optional, uses connected wallet)

**Response:**
```json
{
  "assetId": "uuid",
  "url": "/api/asset/uuid",
  "title": "Image Title",
  "price": 0.01
}
```

### GET /api/asset/:id

Get asset access (returns 402 if not paid).

**Response (402):**
```json
{
  "error": "Payment Required",
  "paymentRequest": { ... },
  "paymentRequestToken": "..."
}
```

**Response (200 with auth):**
```json
{
  "url": "/api/full/:id"
}
```

### POST /api/receipt

Verify payment and get access token.

**Request:**
```json
{
  "signature": "transaction_signature",
  "paymentRequestToken": "...",
  "imageId": "asset_id"
}
```

**Response:**
```json
{
  "accessToken": "jwt_token"
}
```

### GET /api/full/:id

Download full image (requires authentication).

**Headers:**
- `Authorization: Bearer <accessToken>`
- OR query param: `?access=<accessToken>`

## Frontend Components

### Image Gallery (`/images`)

- Displays all uploaded images
- Shows payment status for each image
- Handles wallet connection
- Initiates payment flow
- Downloads images after payment

### Upload Page (`/upload`)

- Image upload form
- Wallet connection
- Price and metadata input
- Recipient wallet configuration

## Configuration

### Solana DevNet Setup

1. Get USDC on DevNet:
   - Use [Circle Faucet](https://faucet.circle.com/) for USDC
   - Or use [Solana Faucet](https://faucet.solana.com/) for SOL

2. USDC Mint Address (DevNet):
   ```
   4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
   ```

### Production Setup

For production:

1. Change `SOLANA_NETWORK` to `mainnet-beta`
2. Update `SOLANA_RPC_URL` to mainnet RPC
3. Update `SOLANA_USDC_MINT` to mainnet USDC mint
4. Use a secure `JWT_SECRET`
5. Consider using IPFS or S3 for image storage
6. Add proper error handling and logging
7. Implement rate limiting
8. Add database for production (PostgreSQL, etc.)

## Testing

1. **Upload an image:**
   - Go to `/upload`
   - Connect wallet
   - Upload image with price 0.01 USDC

2. **Access the image:**
   - Go to `/images`
   - Click "Check access" on an image
   - Connect wallet if not connected
   - Click "Pay 0.01 USDC"
   - Approve transaction in wallet
   - Image will open in new tab

## Troubleshooting

### Payment Verification Fails

- Ensure transaction is confirmed on Solana
- Check that correct amount was transferred
- Verify recipient address matches
- Check transaction signature is correct

### Wallet Connection Issues

- Ensure Phantom or Solflare is installed
- Check browser console for errors
- Try disconnecting and reconnecting wallet

### Image Not Loading

- Check file exists in `uploads/` directory
- Verify asset metadata in `data/assets.json`
- Check server logs for errors

## Dependencies

- `@solana/web3.js` - Solana blockchain interaction
- `@solana/wallet-adapter-*` - Wallet integration
- `@solana/spl-token` - SPL token operations
- `jsonwebtoken` - JWT token generation
- `fs-extra` - File system operations
- `next` - Next.js framework

## License

MIT License

## Contributing

Contributions welcome! Please open an issue or submit a PR.
