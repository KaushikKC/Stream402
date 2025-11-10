# Supabase Setup Guide for Stream402

This guide will help you set up Supabase for production-ready storage, replacing local file storage.

## 🚀 Quick Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: stream402 (or your project name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for hackathon

### Step 2: Get API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Step 3: Set Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Create Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- `assets` table - for image metadata
- `payments` table - for payment records
- `reputation` table - for user reputation scores
- `reputation_nfts` table - for reputation NFT records

### Step 5: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 6: Update Code to Use Database

The code has been updated to automatically use Supabase when configured. If Supabase is not configured, it will fall back to local storage.

## 📊 Database Schema

### Assets Table
- Stores image metadata (title, price, IPFS URLs, tags)
- Indexed by recipient and created_at

### Payments Table
- Stores payment transactions
- Linked to assets via asset_id
- Indexed by payer and asset_id

### Reputation Table
- Stores user reputation scores
- Updated after each payment
- Used for trust levels

### Reputation NFTs Table
- Stores minted reputation NFTs
- Linked to reputation via wallet
- Indexed by wallet and timestamp

## 🔄 Migration from Local Storage

If you have existing data in local storage:

1. Export your local data:
   ```bash
   # Your data is in data/ directory
   # assets.json, payments.json, reputation.json, reputation-nfts.json
   ```

2. Import to Supabase:
   - Use Supabase dashboard → Table Editor
   - Or create a migration script (see below)

## 🛠️ Migration Script (Optional)

Create a script to migrate existing data:

```typescript
// scripts/migrate-to-supabase.ts
import { readAssets, readPayments } from "../lib/storage";
import { readReputations, getReputationNFTs } from "../reputation-storage";
import { saveAssetToDB, savePaymentToDB, saveReputationToDB, saveReputationNFTToDB } from "../lib/storage-db";

async function migrate() {
  // Migrate assets
  const assets = readAssets();
  for (const asset of assets) {
    await saveAssetToDB(asset);
  }

  // Migrate payments
  const payments = readPayments();
  for (const payment of payments) {
    await savePaymentToDB(payment);
  }

  // Migrate reputation
  const reputations = readReputations();
  for (const wallet in reputations) {
    await saveReputationToDB(reputations[wallet]);
  }

  // Migrate reputation NFTs
  for (const wallet in reputations) {
    const nfts = getReputationNFTs(wallet);
    for (const nft of nfts) {
      await saveReputationNFTToDB(nft);
    }
  }
}
```

## ✅ Verification

1. Check Supabase dashboard → Table Editor
2. You should see all tables created
3. Test by uploading an image - it should appear in the `assets` table
4. Make a payment - it should appear in the `payments` table

## 🔒 Security Notes

- The current setup allows public read access (good for hackathon demo)
- For production, you should:
  - Enable Row Level Security (RLS) policies
  - Add authentication
  - Restrict write access to authenticated users
  - Use service role key for server-side operations

## 🚨 Troubleshooting

**Issue**: "Supabase credentials not found"
- **Fix**: Make sure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Issue**: "Table does not exist"
- **Fix**: Run the SQL schema in Supabase SQL Editor

**Issue**: "Permission denied"
- **Fix**: Check RLS policies in Supabase → Authentication → Policies

**Issue**: Data not showing
- **Fix**: Check browser console for errors, verify API keys are correct

## 📝 Next Steps

1. ✅ Set up Supabase project
2. ✅ Add environment variables
3. ✅ Run database schema
4. ✅ Install @supabase/supabase-js
5. ✅ Test upload and payment flow
6. ✅ Verify data appears in Supabase dashboard

Your app will now work in production! 🎉

