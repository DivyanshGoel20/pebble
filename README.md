# Pebble

Pebble is a clean, personalized DeFi dashboard that brings together wallet data, NFTs, token prices, transaction history, gas fees, and token swaps, all in one place across multiple chains, powered by 1inch APIs.

## 🌐 What is Pebble?

Pebble is a multi-chain DeFi web app that provides a unified interface to:

- Monitor your assets (tokens, NFTs, balances)
- Track real-time prices and gas fees
- Explore transaction history
- Swap tokens instantly
- Resolve ENS names and wallet details

Built for simplicity and speed, it helps users manage their on-chain activity without switching platforms or tools.

## 🛠️ What's Inside?

A full-stack dApp with:

- **Frontend**: Modern React + Tailwind UI
- **Backend**: Node.js proxy for interacting with blockchain APIs securely
- **Real-time Data**: Live token prices, gas fees, and transaction status
- **Wallet Connect**: Add and manage wallet addresses easily
- **Chain Support**: Ethereum, Arbitrum, Base, Gnosis, Avalanche and Polygon

## ⚙️ Key Features

- **🔐 Wallet Dashboard**: View tokens, balances, and NFTs
- **📈 Token Prices**: Real-time price updates from spot markets
- **⛽ Gas Tracker**: Track gas fees across multiple chains
- **🖼️ NFT Viewer**: See your full NFT collection
- **🔄 Token Swaps**: Swap tokens using 1inch's advanced DEX aggregation
- **📋 Transaction History**: Browse your recent transactions
- **🌐 ENS Resolution**: Look up ENS names and reverse wallet info
- **🔀 Multi-Chain Support**: Works across major chains

## 🔌 APIs Used

The app connects to 10 powerful 1inch APIs for rich blockchain functionality:

| API | Purpose |
|-----|---------|
| **Balance API** | Fetches token balances of a wallet |
| **NFT API** | Retrieves all NFTs owned by a wallet on Ethereum and Gnosis |
| **Gas Price API** | Returns current gas fees across supported chains |
| **Token API** | Resolves token contract addresses using names or symbols |
| **Traces API** | Gives low-level data about transactions and blocks |
| **History API** | Fetches recent transactions from a given wallet |
| **Spot Price API** | Returns the live market price of any token |
| **Domain API** | Finds ENS names and resolves reverse lookups |
| **Token Details API** | Provides token metadata (decimals, name, symbol, etc.) |
| **Swap API** | Generates swap quotes and enables token swaps via 1inch |