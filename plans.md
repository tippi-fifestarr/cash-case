 Ready to code?

 Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Plan: Deploy to Sponsor Testnets

 Context

 ETHDenver 2026 hackathon. Contracts work locally but aren't on any sponsor testnets. User can deploy via Remix — we need contracts ready and the frontend multi-chain aware.

 Targeting 3 sponsor tracks:
 - Base ($10k) — "Self-Sustaining Autonomous Agents" → agent system on Base Sepolia
 - 0g Labs ($25k) — "On-Chain Agents / DeFAI" → game + agents on 0G Newton Testnet
 - ADI Foundation ($25k) — "Open Project" ($19k) → game on ADI Chain

 The Problem

 CashCase.sol (Brodinger's Case) is written but untracked and untested. Chainlink VRF + Price Feeds only exist on Base Sepolia — 0G and ADI don't have Chainlink infrastructure. The
 frontend is hardcoded to localhost:8545.

 Target Chains

 ┌──────────────────────────┬───────┬───────────────────────────────┬──────────────────────────────┬───────┐
 │          Chain           │  ID   │              RPC              │          Chainlink?          │ Token │
 ├──────────────────────────┼───────┼───────────────────────────────┼──────────────────────────────┼───────┤
 │ Base Sepolia             │ 84532 │ https://sepolia.base.org      │ Yes (VRF v2.5 + Price Feeds) │ ETH   │
 ├──────────────────────────┼───────┼───────────────────────────────┼──────────────────────────────┼───────┤
 │ 0G Newton Testnet        │ 16602 │ https://evmrpc-testnet.0g.ai  │ No                           │ A0GI  │
 ├──────────────────────────┼───────┼───────────────────────────────┼──────────────────────────────┼───────┤
 │ ADI Chain (mainnet only) │ 36900 │ https://rpc.adifoundation.ai/ │ No                           │ ADI   │
 └──────────────────────────┴───────┴───────────────────────────────┴──────────────────────────────┴───────┘

 Plan

 Step 1: Test and commit CashCase.sol

 - Write test/CashCase.test.ts covering the new mechanics: single-seed VRF, Brodinger collapse, commit-reveal rounds, game tiers, forfeit
 - Adapt from existing DealOrNoDeal.test.ts patterns (mock VRF, mock price feed)
 - Fix any bugs found
 - Commit both CashCase.sol and tests

 Files: contracts/CashCase.sol, test/CashCase.test.ts

 Step 2: Add mock-deployable mode for non-Chainlink chains

 For 0G and ADI (no Chainlink), deploy MockVRFCoordinator + MockV3Aggregator alongside the game contract. The existing mocks in contracts/mocks/ already work — they just need to be
 deployed on those chains too.

 Create a simple deploy checklist/script that:
 1. Deploys MockV3Aggregator (price = $2000)
 2. Deploys VRFCoordinatorV2_5Mock
 3. Creates + funds VRF subscription
 4. Deploys CashCase with mock addresses
 5. Adds CashCase as VRF consumer
 6. Deploys AgentRegistry

 For Remix: flatten CashCase.sol + mocks so user can deploy directly.

 Files: scripts/flatten.sh or use npx hardhat flatten

 Step 3: Add chain configs to hardhat.config.ts

 Add 0G Newton and ADI Chain network configs:
 og: {
   url: "https://evmrpc-testnet.0g.ai",
   chainId: 16602,
   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
 },
 adi: {
   url: "https://rpc.adifoundation.ai/",
   chainId: 36900,
   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
 },

 File: hardhat.config.ts

 Step 4: Update deploy script for CashCase

 Create deploy/05-deploy-cashcase.ts that:
 - On local/testnet-without-chainlink: deploys mocks first, then CashCase
 - On Base Sepolia: uses real Chainlink addresses (VRF Coordinator, key hash, ETH/USD price feed from Chainlink docs)
 - Also deploys AgentRegistry
 - Prints all addresses for frontend env vars

 Files: deploy/05-deploy-cashcase.ts

 Step 5: Update frontend for multi-chain

 Currently frontend is hardcoded to http://127.0.0.1:8545. Need to:
 - Support Base Sepolia (84532), 0G (16602), ADI (36900), and localhost (31337)
 - Add chain definitions to wagmi config
 - Contract addresses per chain (env vars or a config map)
 - Auto-detect which chain user is on, show correct contract
 - Update the auto-fund logic to only work on localhost

 Files: frontend/app/page.tsx, frontend/lib/contracts.ts, wagmi config file

 Step 6: Create VRF auto-fulfiller for non-Chainlink chains

 On 0G and ADI, there are no Chainlink keepers to fulfill VRF. Need scripts/auto-fulfill-vrf.ts adapted to connect to those RPCs and auto-fulfill mock VRF requests (same as local, just
 different RPC).

 File: scripts/auto-fulfill-vrf.ts (update to accept --network flag, already works with hardhat --network param)

 Step 7: Deployment (user does via Remix or hardhat)

 Base Sepolia (real Chainlink):
 1. User creates VRF subscription at vrf.chain.link for Base Sepolia
 2. Fund subscription with LINK (get from faucets.chain.link)
 3. Look up VRF Coordinator + key hash + ETH/USD price feed from Chainlink supported networks
 4. Deploy CashCase via Remix with real Chainlink params
 5. Add contract as VRF consumer in subscription dashboard
 6. Deploy AgentRegistry (no constructor args)

 0G Newton Testnet (mock Chainlink):
 1. Get testnet A0GI from 0G faucet (0.1/day limit)
 2. Deploy MockV3Aggregator + VRFCoordinatorV2_5Mock via Remix
 3. Create subscription + fund it on mock coordinator
 4. Deploy CashCase with mock addresses
 5. Deploy AgentRegistry
 6. Run auto-fulfill-vrf.ts pointed at 0G RPC

 ADI Chain (mock Chainlink):
 1. Bridge ADI/ETH via bridge.adifoundation.ai
 2. Same mock deployment flow as 0G
 3. Run auto-fulfill-vrf.ts pointed at ADI RPC

 Step 8: Update JUDGES.md

 Reflect Brodinger's Case design, multi-chain deployment, and target the 3 sponsor tracks.

 File: JUDGES.md

 Verification

 1. npx hardhat test — all old tests still pass + new CashCase tests pass
 2. Deploy to Base Sepolia via Remix → play a game with MetaMask on Base Sepolia
 3. Deploy to 0G with mocks → verify game works with auto-fulfiller running
 4. Frontend connects to each chain and shows correct game state
 5. Agent system registers + runs on at least one testnet

 Order of Operations

 1. Step 1 (tests) — must come first, might find bugs in CashCase.sol
 2. Steps 2-4 (deploy infra) — parallel-ish
 3. Step 5 (frontend) — after we have at least one testnet deployment
 4. Steps 6-7 (deploy) — user deploys via Remix once contracts are ready
 5. Step 8 (docs) — last