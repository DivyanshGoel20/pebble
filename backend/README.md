# Backend

The backend server provides API endpoints that connect the frontend to various blockchain services and data sources.

## What the server does

The server acts as a proxy between the frontend and external APIs, handling:

- **NFT Data**: Fetching NFT collections and metadata for wallet addresses
- **Gas Prices**: Getting real-time gas prices for different blockchain networks
- **Token Balances**: Retrieving token balances and metadata for wallet addresses
- **Transaction History**: Fetching wallet transaction history and traces
- **Spot Prices**: Getting current token prices across different networks
- **Domain Lookups**: Resolving blockchain domain names and reverse lookups
- **Token Swaps**: Handling token swap quotes, approvals, and transactions
- **Token Search**: Searching for tokens by name, symbol, or address

## What the backend is responsible for

- Managing API keys and authentication for external services
- Processing and formatting data from external APIs for frontend consumption
- Handling CORS and serving the frontend build files
- Providing a unified interface for blockchain data access
- Converting data formats (e.g., wei to gwei for gas prices)
- Error handling and logging for API requests