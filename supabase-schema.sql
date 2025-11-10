-- Supabase Database Schema for Stream402
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price BIGINT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 6,
  currency TEXT NOT NULL DEFAULT 'USDC',
  mint TEXT NOT NULL,
  recipient TEXT NOT NULL,
  filename TEXT NOT NULL,
  thumb_filename TEXT,
  ipfs_cid TEXT,
  ipfs_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at BIGINT NOT NULL,
  created_at_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id TEXT NOT NULL,
  signature TEXT NOT NULL UNIQUE,
  payer TEXT NOT NULL,
  amount BIGINT NOT NULL,
  timestamp BIGINT NOT NULL,
  payment_request_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Reputation table
CREATE TABLE IF NOT EXISTS reputation (
  wallet TEXT PRIMARY KEY,
  score INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'New',
  total_payments INTEGER NOT NULL DEFAULT 0,
  total_downloads INTEGER NOT NULL DEFAULT 0,
  total_earnings BIGINT NOT NULL DEFAULT 0,
  last_updated BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reputation NFTs table
CREATE TABLE IF NOT EXISTS reputation_nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet TEXT NOT NULL,
  mint TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  transaction_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (wallet) REFERENCES reputation(wallet) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assets_recipient ON assets(recipient);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer);
CREATE INDEX IF NOT EXISTS idx_payments_asset_id ON payments(asset_id);
CREATE INDEX IF NOT EXISTS idx_payments_timestamp ON payments(timestamp);
CREATE INDEX IF NOT EXISTS idx_reputation_nfts_wallet ON reputation_nfts(wallet);
CREATE INDEX IF NOT EXISTS idx_reputation_nfts_timestamp ON reputation_nfts(timestamp);

-- Enable Row Level Security (RLS) - Optional, adjust based on your needs
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_nfts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed)
CREATE POLICY "Allow public read access to assets" ON assets
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to payments" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to reputation" ON reputation
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to reputation_nfts" ON reputation_nfts
  FOR SELECT USING (true);

-- Allow insert/update for authenticated users (you can adjust this)
-- For now, we'll allow public inserts (adjust based on your security needs)
CREATE POLICY "Allow public insert to assets" ON assets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to payments" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public upsert to reputation" ON reputation
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert to reputation_nfts" ON reputation_nfts
  FOR INSERT WITH CHECK (true);

