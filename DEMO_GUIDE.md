# Stream402 - Demo Guide for Hackathon Tracks

## 🎯 Tracks Applied For

1. **Best Trustless Agent** ($10,000 prize)
   - Autonomous agents with identity, reputation, and validation systems

2. **Best AgentPay Demo** ($5,000 prize)
   - AI Agents that autonomously pay for APIs, LLM tokens, or data via Solana USDC + HTTP-402 micropayments

---

## 🚀 Quick Demo Flow (5 minutes)

### Step 1: Show Agent Identity & Reputation (Trustless Agent Track)
1. Navigate to `/agent` page
2. Connect wallet (Phantom/Solflare)
3. **Highlight**: Agent identity is automatically created from wallet address
4. **Show**: Reputation badge showing:
   - Reputation score
   - Trust level (Low/Medium/High)
   - Total payments made
   - Max autonomous payment amount based on reputation

**Key Point**: "This is a trustless agent - identity is verified on-chain via wallet address, and reputation is tracked through NFT-based milestones."

### Step 2: Demonstrate Autonomous Payment (AgentPay Track)
1. Type query: **"I want a Solana logo"**
2. **Show**: Agent automatically:
   - Parses natural language query
   - Searches assets by title/tags
   - Finds best match
   - Makes autonomous decision to pay
   - Validates balance and reputation
   - **Auto-pays** if validated (if autonomous mode is ON)

3. **Highlight the flow**:
   ```
   User Query → Agent Parses → Finds Asset → Validates Payment → Auto-Pays → Downloads
   ```

**Key Point**: "The agent autonomously pays for content using Solana USDC via HTTP-402 protocol - no manual approval needed for validated requests."

### Step 3: Show Trustless Validation
1. **Show**: Autonomous decision panel displaying:
   - Decision: APPROVED/REJECTED
   - Confidence score
   - Balance check
   - Reputation validation
   - Trustless validation reason

2. **Explain**: "All validation happens on-chain - the agent checks:
   - Sufficient USDC balance
   - Price reasonableness (prevents accidental large payments)
   - Reputation-based trust level
   - All verified on Solana blockchain - completely trustless"

### Step 4: Show Reputation System (Trustless Agent Track)
1. Navigate to `/provider` dashboard
2. **Show**: Reputation NFTs minted after payments
3. **Explain**: "Each payment increases reputation, and milestones are minted as NFTs on-chain - providing verifiable, trustless reputation history."

### Step 5: Show Multiple Agent Interactions
1. Upload an image with tags: "Bitcoin", "crypto", "logo"
2. Go to agent page
3. Try queries:
   - "I want a Bitcoin logo"
   - "Show me crypto images"
   - "Find Bitcoin assets"

4. **Show**: Agent finds matches, shows alternatives, and can auto-pay for multiple assets

---

## 🎬 Demo Script (2-3 minutes)

### Opening (30 seconds)
"Today I'm demonstrating Stream402 - an autonomous agent system that enables trustless, agent-to-agent payments for digital content using Solana and HTTP-402 protocol.

We're applying for two tracks:
1. **Best Trustless Agent** - showing identity, reputation, and validation systems
2. **Best AgentPay Demo** - showing autonomous payment for content via Solana USDC"

### Main Demo (90 seconds)

**Part 1: Agent Identity (30 seconds)**
"First, let me show you the agent identity system. When I connect my wallet, the agent automatically creates an identity based on my wallet address. You can see my reputation score, trust level, and payment history - all tracked on-chain through NFT-based milestones."

[Show agent page with connected wallet]

**Part 2: Autonomous Payment (60 seconds)**
"Now, watch the agent autonomously pay for content. I'll type: 'I want a Solana logo'"

[Type query and show autonomous decision]

"The agent:
1. Parsed my natural language query
2. Found matching assets
3. Made an autonomous decision to pay
4. Validated my balance and reputation on-chain
5. Automatically paid using Solana USDC via HTTP-402 protocol
6. Downloaded the asset"

[Show payment transaction on Solana Explorer]

"This is completely trustless - all validation happens on-chain. The agent can autonomously pay for content up to a certain amount based on reputation, preventing accidental large payments while enabling seamless micropayments."

### Closing (30 seconds)
"Key features:
- **Trustless Identity**: Wallet-based, on-chain verified
- **Reputation System**: NFT-based milestones, verifiable history
- **Autonomous Payments**: Auto-pay for validated requests
- **HTTP-402 Protocol**: Standard micropayment flow
- **Natural Language**: AI-powered query understanding

This enables true agent-to-agent commerce where agents can autonomously negotiate and pay for content without human intervention."

---

## 🔑 Key Talking Points

### For "Best Trustless Agent" Track:
1. **Identity System**: 
   - Wallet address = agent identity
   - On-chain verification
   - No centralized identity provider

2. **Reputation System**:
   - NFT-based reputation milestones
   - On-chain verifiable history
   - Trust levels based on reputation score

3. **Validation System**:
   - On-chain balance checks
   - Price reasonableness validation
   - Reputation-based trust scoring
   - All decisions are verifiable on Solana

### For "Best AgentPay Demo" Track:
1. **Autonomous Payment**:
   - Agent makes payment decisions automatically
   - No manual approval for validated requests
   - Seamless user experience

2. **HTTP-402 Protocol**:
   - Standard 402 Payment Required responses
   - Micropayment flow
   - Time-limited access tokens

3. **Solana USDC Integration**:
   - Fast, low-cost payments
   - On-chain verification
   - Real-time balance checks

4. **AI/Agent Integration**:
   - Natural language query processing
   - Intelligent asset matching
   - Confidence scoring

---

## 📋 Pre-Demo Checklist

- [ ] Upload at least 3-5 images with relevant tags (Solana, Bitcoin, Ethereum, crypto, logo)
- [ ] Ensure wallet has USDC on Devnet (get from faucet if needed)
- [ ] Test autonomous payment flow
- [ ] Verify reputation NFTs are displaying
- [ ] Have Solana Explorer open to show transactions
- [ ] Test multiple queries to show search functionality
- [ ] Ensure autonomous mode toggle is working

---

## 🎥 Recording Tips

1. **Screen Recording**: Record at 1080p, show browser + terminal (if showing logs)
2. **Voice Over**: Explain each step clearly
3. **Highlight**: Use cursor to point at key features
4. **Show Transactions**: Open Solana Explorer to show on-chain verification
5. **Show Code**: Briefly show key files if time permits:
   - `lib/agent-autonomous.ts` - Autonomous decision logic
   - `app/agent/page.tsx` - Agent UI
   - `lib/reputation-storage.ts` - Reputation system

---

## 🚨 Troubleshooting

**Issue**: Agent not auto-paying
- **Fix**: Check autonomous mode toggle is ON
- **Fix**: Ensure wallet has sufficient USDC balance
- **Fix**: Check price is within autonomous payment threshold

**Issue**: No reputation showing
- **Fix**: Make a payment first to generate reputation
- **Fix**: Check `/provider` dashboard for reputation NFTs

**Issue**: No assets found
- **Fix**: Upload some images with tags first
- **Fix**: Use example queries: "Solana logo", "Bitcoin image"

---

## 📊 Metrics to Highlight

- **Payment Speed**: < 5 seconds (Solana fast finality)
- **Cost**: < $0.001 per transaction
- **Autonomous Decisions**: Real-time validation
- **Reputation Accuracy**: On-chain verified
- **Query Understanding**: Natural language processing

---

## 🎯 Success Criteria

### Best Trustless Agent Track:
✅ Identity system (wallet-based)  
✅ Reputation system (NFT-based)  
✅ Validation system (on-chain)  
✅ Autonomous decision-making  

### Best AgentPay Demo Track:
✅ Autonomous payment flow  
✅ Solana USDC integration  
✅ HTTP-402 protocol  
✅ AI/Agent integration  

---

## 📝 Notes

- Emphasize **trustless** nature - no centralized authority
- Show **on-chain verification** - all decisions are verifiable
- Highlight **autonomous** capability - agent makes decisions
- Demonstrate **real-time** payments - fast and seamless
- Show **reputation-based trust** - builds over time

Good luck with your demo! 🚀

