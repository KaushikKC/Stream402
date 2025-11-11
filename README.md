# Stream402

**Stream402 - A complete platform for monetizing digital content using Solana payments via the HTTP 402 Payment Required protocol.**

Stream402 enables content creators to monetize their digital assets (images, videos, audio, etc.) through micropayments on Solana. Built with Next.js, it features autonomous agent networks, reputation systems, IPFS storage, and a comprehensive SDK for easy integration.

## 🌟 Key Features

### Core Functionality
- **Image Upload & Monetization** - Upload images with custom pricing and tags
- **HTTP 402 Payment Challenge** - Standardized payment protocol implementation
- **Solana Wallet Integration** - Connect Phantom, Solflare, or any Solana wallet
- **SPL Token Payments** - Pay with USDC on Solana DevNet/Mainnet
- **On-Chain Verification** - Payments verified directly on Solana blockchain
- **Time-Limited Access** - JWT tokens provide secure, temporary access
- **IPFS Storage** - Decentralized storage via Pinata for production-ready deployments
- **Low-Resolution Previews** - Free previews with full-resolution after payment

### Advanced Features
- **Stream402 SDK** - TypeScript SDK for easy integration into any application
- **Autonomous Agent Network** - AI agents that automatically discover, negotiate, and pay for content
- **Reputation System** - NFT-based reputation scores that track user activity
- **Provider Dashboard** - Track earnings, downloads, and asset performance
- **Search & Tags** - Find content by title or tags
- **Supabase Database** - Production-ready PostgreSQL database with automatic fallback

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- A Solana wallet (Phantom or Solflare)
- USDC on Solana DevNet (for testing)
- Supabase account (optional, for production)
- Pinata account (for IPFS storage)

### Installation

1. **Clone and install:**

```bash
git clone <repository-url>
cd img402
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
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# IPFS (Pinata) Configuration
PINATA_JWT=your_pinata_jwt_token_here

# Supabase Configuration (Optional - falls back to local storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Service Wallet for NFT Minting (Optional)
SERVICE_WALLET_PRIVATE_KEY=your_service_wallet_private_key_base58

# Metaplex API Key (Optional)
METAPLEX_API_KEY=your_metaplex_api_key
```

3. **Set up Supabase (Optional):**

Run the SQL schema in `supabase-schema.sql` in your Supabase SQL Editor. This sets up tables for assets, payments, reputation, and agent wallets.

4. **Run the development server:**

```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📖 How It Works

### 1. Image Upload Flow

1. Provider navigates to `/upload`
2. Connects Solana wallet
3. Uploads image with:
   - Title
   - Price (in USDC)
   - Tags (comma-separated)
   - Recipient wallet (optional, defaults to connected wallet)
4. Image is:
   - Uploaded to IPFS (Pinata)
   - Thumbnail generated (low-resolution preview)
   - Metadata saved to database
5. Asset ID is generated and returned

### 2. Payment Flow (X402 Protocol)

1. **Client requests image:** `GET /api/asset/:assetId`
2. **Server responds with 402:**
   ```json
   {
     "error": "Payment Required",
     "paymentChallenge": {
       "version": "1.0",
       "network": "solana:devnet",
       "currency": "USDC",
       "decimals": 6,
       "amount": 10000,
       "mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
       "recipient": "...",
       "expiresAt": 1234567890,
       "assetId": "...",
       "paymentRequestToken": "..."
     }
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
   - Reputation NFT may be minted (if criteria met)
5. **Client accesses image:**
   - Retries `GET /api/asset/:assetId` with `Authorization: Bearer <token>`
   - Server returns IPFS URL or download URL
   - Client can download full image

### 3. Payment Verification

The server verifies payments by:

1. Fetching transaction from Solana blockchain
2. Checking transaction status (confirmed, no errors)
3. Verifying token transfer amount
4. Confirming recipient address matches
5. Validating transfer amount meets requirement
6. Checking challenge expiration (if provided)

## 🤖 Autonomous Agent Network

Stream402 features an autonomous agent system that can automatically discover, evaluate, and purchase content without manual intervention.

### How Agents Work

1. **Agent Creation:**
   - Users create dedicated agent wallets
   - Each agent has its own Solana keypair
   - Private keys are encrypted with a password
   - Agents can be funded with USDC

2. **Natural Language Queries:**
   - Users input queries like "I want a Solana logo" or "Bitcoin image"
   - Agent parses the query and searches available assets
   - Uses keyword matching and tag-based search

3. **Autonomous Decision Making:**
   - Agent evaluates:
     - Query relevance to asset
     - Asset price vs. agent balance
     - Agent reputation score
     - Payment history
   - Makes autonomous decision to pay or skip

4. **Automatic Payment:**
   - If approved, agent automatically:
     - Constructs payment transaction
     - Signs with agent's private key (server-side, no popups!)
     - Submits payment
     - Downloads asset
   - All happens without user interaction

### Agent Flow

```
User Query → Parse Query → Find Asset → Evaluate Decision → Auto-Pay → Download
```

### Using Agents

1. **Create Agent:**
   - Go to `/agent/manage`
   - Click "Create Agent"
   - Enter password (used to encrypt agent wallet)
   - Agent wallet is created and stored

2. **Fund Agent:**
   - Transfer USDC to agent wallet
   - Agent balance is tracked automatically

3. **Use Agent:**
   - Go to `/agent`
   - Select your agent
   - Enter agent password
   - Enter query (e.g., "I want a Solana logo")
   - Agent automatically finds, pays, and downloads

### Agent Features

- **No Popups** - Server-side signing means no wallet popups
- **Password Protection** - Agent wallets encrypted with user password
- **Remember Password** - Optional password persistence for convenience
- **Balance Tracking** - Real-time balance and spending statistics
- **Autonomous Mode** - Toggle for automatic payment decisions

## 🎖️ Reputation System

Stream402 includes a comprehensive reputation system that tracks user activity and mints NFTs for milestones.

### How Reputation Works

**Reputation Score Calculation:**
- Each payment: +10 points
- Each download: +5 points
- Earnings: +1 point per 0.001 USDC earned

**Reputation Levels:**
- **Newcomer** (0-9 points)
- **Beginner** (10-49 points)
- **Intermediate** (50-99 points)
- **Advanced** (100-249 points)
- **Expert** (250-499 points)
- **Master** (500-999 points)
- **Legendary** (1000+ points)

### NFT Minting

Reputation NFTs are automatically minted when:

1. **First Payment** - Always mints on first payment
2. **Score Increase** - Every payment increases score (triggers mint)
3. **Level Change** - When reputation level increases

**NFT Features:**
- Programmable NFTs (pNFTs) on Solana
- SVG images generated dynamically
- Metadata includes:
  - Reputation score
  - Level
  - Total payments
  - Total downloads
  - Total earnings
- Stored on Arweave via Irys
- Viewable on Solana Explorer

### Viewing Reputation

- **Navbar Badge** - Shows current reputation level
- **Provider Dashboard** - Detailed reputation stats
- **NFT Gallery** - View all minted reputation NFTs

## 📦 Stream402 SDK

The Stream402 SDK makes it easy to integrate payment functionality into any application.

### Installation

```bash
npm install stream402-sdk
```

### Quick Start

#### 1. Discover an Asset

```typescript
import { discover } from "stream402-sdk";

const result = await discover("https://example.com/api/asset/123");

if (result.type === "free") {
  console.log("Free asset:", result.url);
} else {
  console.log("Payment required:", result.challenge.amount);
}
```

#### 2. Pay and Fetch

```typescript
import { payAndFetch } from "stream402-sdk";
import { useWallet } from "@solana/wallet-adapter-react";

function MyComponent() {
  const wallet = useWallet();

  const handlePay = async () => {
    const result = await payAndFetch(
      "https://example.com/api/asset/123",
      wallet
    );
    
    // Access the resource
    window.open(result.downloadUrl, "_blank");
  };

  return <button onClick={handlePay}>Pay & Download</button>;
}
```

#### 3. Upload Asset

```typescript
import { uploadAsset } from "stream402-sdk";

const result = await uploadAsset(file, {
  title: "My Image",
  price: 0.01,
  tags: ["nature", "landscape"],
}, wallet);

console.log("Asset ID:", result.assetId);
```

### SDK API Reference

See [SDK README](./sdk/README.md) for complete API documentation.

## 🗄️ Database & Storage

### Supabase Integration

Stream402 uses Supabase (PostgreSQL) for production-ready data storage:

- **Assets** - Image metadata, pricing, IPFS URLs
- **Payments** - Transaction records and verification
- **Reputation** - User reputation scores and levels
- **Reputation NFTs** - Minted NFT records
- **Agent Wallets** - Encrypted agent keypairs

### Local Storage Fallback

If Supabase is not configured, the app automatically falls back to local JSON file storage for development.

### IPFS Storage

All images are uploaded to IPFS via Pinata:

- Original images stored on IPFS
- Thumbnails generated and stored on IPFS
- IPFS URLs used for serving images
- Local storage only used as fallback

## 📊 Provider Dashboard

Content creators can track their performance at `/provider`:

- **Total Earnings** - Sum of all payments received
- **Total Downloads** - Number of times assets were purchased
- **Asset Statistics** - Per-asset performance metrics
- **Reputation Display** - Current reputation level and score
- **NFT Gallery** - View all minted reputation NFTs

## 🔍 Search & Discovery

- **Search by Title** - Find assets by name
- **Search by Tags** - Filter by tags
- **Tag System** - Add tags when uploading for better discoverability
- **Real-time Results** - Instant search results

## 🏗️ Project Structure

```
img402/
├── app/
│   ├── api/
│   │   ├── upload/              # POST - Upload images
│   │   ├── asset/[id]/          # GET - Asset access (returns 402 if not paid)
│   │   ├── receipt/             # POST - Verify payment and get access token
│   │   ├── full/[id]/           # GET - Download full image (requires auth)
│   │   ├── thumb/[id]/          # GET - Get thumbnail
│   │   ├── images/
│   │   │   ├── list/            # GET - List all images
│   │   │   └── search/          # GET - Search images
│   │   ├── provider/
│   │   │   ├── assets/          # GET - Provider's assets
│   │   │   ├── earnings/       # GET - Provider's earnings
│   │   │   └── stats/           # GET - Provider's statistics
│   │   ├── reputation/
│   │   │   ├── [wallet]/        # GET - Get reputation for wallet
│   │   │   └── mint-nft/        # POST - Manually mint reputation NFT
│   │   └── agent/
│   │       ├── request/        # POST - Agent query handler
│   │       ├── create/          # POST - Create agent wallet
│   │       ├── list/            # GET - List user's agents
│   │       ├── fund/            # POST - Verify agent funding
│   │       └── pay/              # POST - Server-side agent payment
│   ├── images/                  # Image gallery with payment flow
│   ├── upload/                  # Image upload page
│   ├── provider/                # Provider dashboard
│   ├── agent/                   # Agent network interface
│   ├── agent/manage/            # Agent wallet management
│   └── page.tsx                 # Home page
├── components/
│   ├── navbar.tsx               # Global navigation
│   ├── reputation-badge.tsx    # Reputation display component
│   └── solana/
│       └── solana-provider.tsx  # Solana wallet provider
├── lib/
│   ├── solana-config.ts         # Solana configuration
│   ├── jwt.ts                   # JWT utilities
│   ├── payment-verification.ts  # Payment verification logic
│   ├── payment-challenge.ts     # 402 challenge formatting
│   ├── storage.ts               # Asset and payment storage
│   ├── storage-db.ts            # Supabase database layer
│   ├── ipfs.ts                  # IPFS (Pinata) integration
│   ├── thumbnail.ts             # Thumbnail generation
│   ├── reputation.ts            # Reputation calculation
│   ├── reputation-storage.ts    # Reputation data management
│   ├── nft-mint.ts              # NFT minting (Metaplex)
│   ├── agent.ts                 # Agent search and matching
│   ├── agent-autonomous.ts      # Autonomous decision logic
│   ├── agent-wallet.ts          # Agent wallet encryption
│   ├── agent-wallet-storage.ts # Agent wallet persistence
│   └── supabase.ts              # Supabase client
├── sdk/                         # Stream402 SDK package
│   ├── src/
│   │   ├── discover.ts          # Asset discovery
│   │   ├── payAndFetch.ts      # Payment flow
│   │   ├── uploadAsset.ts      # Asset upload
│   │   └── types/              # TypeScript types
│   ├── examples/               # SDK usage examples
│   └── test/                   # SDK tests
└── supabase-schema.sql         # Database schema
```

## 🔌 API Endpoints

### Asset Management

#### POST /api/upload
Upload an image.

**Request:**
- `file`: Image file (multipart/form-data)
- `title`: Image title
- `price`: Price in USDC (e.g., "0.01")
- `tags`: Comma-separated tags
- `recipient`: Recipient wallet address (optional)

**Response:**
```json
{
  "assetId": "uuid",
  "url": "/api/asset/uuid",
  "title": "Image Title",
  "price": 0.01,
  "ipfsCid": "...",
  "ipfsUrl": "https://..."
}
```

#### GET /api/asset/:id
Get asset access (returns 402 if not paid).

**Response (402):**
```json
{
  "error": "Payment Required",
  "paymentChallenge": { ... },
  "paymentRequestToken": "..."
}
```

**Response (200 with auth):**
```json
{
  "url": "/api/full/:id"
}
```

#### POST /api/receipt
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

### Agent Endpoints

#### POST /api/agent/request
Handle agent query and return payment challenge.

**Request:**
```json
{
  "query": "I want a Solana logo",
  "walletAddress": "agent_wallet_address"
}
```

**Response:**
```json
{
  "success": true,
  "assetId": "...",
  "requiresPayment": true,
  "paymentChallenge": { ... }
}
```

#### POST /api/agent/create
Create a new agent wallet.

**Request:**
```json
{
  "userId": "user_wallet_address",
  "password": "agent_password"
}
```

#### POST /api/agent/pay
Server-side agent payment (no popups).

**Request:**
```json
{
  "agentId": "agent_id",
  "password": "agent_password",
  "assetId": "...",
  "paymentChallenge": { ... },
  "paymentRequestToken": "..."
}
```

### Reputation Endpoints

#### GET /api/reputation/:wallet
Get reputation data for a wallet.

**Response:**
```json
{
  "wallet": "...",
  "score": 150,
  "level": "Advanced",
  "totalPayments": 10,
  "totalDownloads": 10,
  "totalEarnings": 100000,
  "nfts": [...]
}
```

## 🧪 Testing

### Manual Testing

1. **Upload an image:**
   - Go to `/upload`
   - Connect wallet
   - Upload image with price 0.01 USDC

2. **Access the image:**
   - Go to `/images`
   - Click on an image
   - Connect wallet if not connected
   - Click "Pay"
   - Approve transaction in wallet
   - Image will open in new tab

3. **Test Agent:**
   - Go to `/agent/manage`
   - Create an agent
   - Fund the agent
   - Go to `/agent`
   - Enter query and watch automatic payment

4. **Check Reputation:**
   - Make a payment
   - Check navbar for reputation badge
   - Go to `/provider` to see detailed stats

### SDK Testing

```bash
cd sdk
npm test
npm run test:integration
```

## 🚢 Deployment

### Vercel Deployment

1. **Set Environment Variables:**
   - Add all `.env.local` variables to Vercel
   - Ensure `PINATA_JWT` is set for IPFS
   - Set `SUPABASE_*` variables for database

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Database Migration:**
   - Run `supabase-schema.sql` in Supabase SQL Editor
   - Ensure `filename` column is nullable

### Production Checklist

- [ ] Change `SOLANA_NETWORK` to `mainnet-beta`
- [ ] Update `SOLANA_RPC_URL` to mainnet RPC
- [ ] Update `SOLANA_USDC_MINT` to mainnet USDC mint
- [ ] Use secure `JWT_SECRET`
- [ ] Configure Supabase for production
- [ ] Set up Pinata for IPFS
- [ ] Configure service wallet for NFT minting
- [ ] Add proper error handling and logging
- [ ] Implement rate limiting
- [ ] Set up monitoring

## 🐛 Troubleshooting

### Payment Verification Fails

- Ensure transaction is confirmed on Solana
- Check that correct amount was transferred
- Verify recipient address matches
- Check transaction signature is correct

### Wallet Connection Issues

- Ensure Phantom or Solflare is installed
- Check browser console for errors
- Try disconnecting and reconnecting wallet

### IPFS Upload Fails

- Verify `PINATA_JWT` is set correctly
- Check Pinata account has available storage
- Review server logs for detailed errors

### Database Errors

- Ensure Supabase is configured correctly
- Run `supabase-schema.sql` migration
- Check that `filename` column is nullable
- Verify RLS policies are set correctly

### Agent Payment Fails

- Verify agent has sufficient balance
- Check agent password is correct
- Ensure agent wallet is funded
- Review server logs for decryption errors

## 📚 Dependencies

### Core
- `next` - Next.js framework
- `@solana/web3.js` - Solana blockchain interaction
- `@solana/wallet-adapter-*` - Wallet integration
- `@solana/spl-token` - SPL token operations
- `jsonwebtoken` - JWT token generation

### Storage & IPFS
- `@supabase/supabase-js` - Supabase client
- `pinata` - IPFS storage via Pinata
- `sharp` - Image processing and thumbnails

### NFT & Reputation
- `@metaplex-foundation/umi` - Metaplex UMI framework
- `@metaplex-foundation/mpl-token-metadata` - Token metadata program
- `@metaplex-foundation/umi-uploader-irys` - Arweave uploads

### Utilities
- `fs-extra` - File system operations
- `uuid` - UUID generation
- `bs58` - Base58 encoding/decoding

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

## 🔗 Links

- [SDK Documentation](./sdk/README.md)
- [Supabase Schema](./supabase-schema.sql)
- [TODO List](./TODO.md)

## 🎯 Hackathon Tracks

Stream402 is designed for:

- **Best Trustless Agent** - Autonomous agents with identity, reputation, and validation
- **Best AgentPay Demo** - AI agents that autonomously pay for APIs, LLM tokens, or data via Solana USDC + HTTP-402

## 📞 Support

For issues and questions, please open an issue on GitHub.
