require('dotenv').config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../frontend/build")));

// NFT endpoint to fetch NFTs using the working v2 API
app.get("/fetchNfts", async (req, res) => {
  const address = req.query.address || "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
  const limit = req.query.limit || 50;
  const offset = req.query.offset || 0;
  const chainIds = req.query.chainIds || 1;

  try {
    // Using the working v2 endpoint
    const url = `https://api.1inch.dev/nft/v2/byaddress`;
    
    const response = await axios.get(url, {
      params: {
        address: address,
        chainIds: chainIds,
        limit: limit,
        offset: offset
      },
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      }
    });

    console.log("1inch API Response:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("1inch API Error:", error.response?.data || error.message);
    console.error("Error Status:", error.response?.status);
    
    res.status(error.response?.status || 500).json({ 
      error: "Failed to fetch NFTs",
      details: error.response?.data || error.message
    });
  }
});

// Gas price endpoint to fetch gas prices
app.get("/gas-price", async (req, res) => {
  try {
    const chainId = req.query.chainId || 1; // Default to Ethereum Mainnet
    console.log(`Fetching gas prices for chain ID: ${chainId}`);
    
    const response = await axios.get(`https://api.1inch.dev/gas-price/v1.4/${chainId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Raw 1inch API response for chain ${chainId}:`, JSON.stringify(response.data, null, 2));
    
    // The 1inch API returns values in wei, convert to gwei for frontend display
    const rawData = response.data;
    const weiToGwei = (weiValue) => {
      const wei = parseFloat(weiValue);
      return (wei / 1000000000).toString(); // Convert wei to gwei
    };
    
    const processedData = {
      baseFee: weiToGwei(rawData.baseFee),
      low: {
        maxPriorityFeePerGas: weiToGwei(rawData.low.maxPriorityFeePerGas),
        maxFeePerGas: weiToGwei(rawData.low.maxFeePerGas)
      },
      medium: {
        maxPriorityFeePerGas: weiToGwei(rawData.medium.maxPriorityFeePerGas),
        maxFeePerGas: weiToGwei(rawData.medium.maxFeePerGas)
      },
      high: {
        maxPriorityFeePerGas: weiToGwei(rawData.high.maxPriorityFeePerGas),
        maxFeePerGas: weiToGwei(rawData.high.maxFeePerGas)
      },
      instant: {
        maxPriorityFeePerGas: weiToGwei(rawData.instant.maxPriorityFeePerGas),
        maxFeePerGas: weiToGwei(rawData.instant.maxFeePerGas)
      }
    };
    
    console.log(`Processed gas data for chain ${chainId}:`, JSON.stringify(processedData, null, 2));
    res.json(processedData);
    
  } catch (error) {
    console.error("Gas Price API Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching gas prices" });
  }
});

// Token balance endpoint to fetch token balances
app.get("/token-balances", async (req, res) => {
  try {
    const { walletAddress, chainId = 1 } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }
    
    console.log(`=== TOKEN BALANCE DEBUG ===`);
    console.log(`Fetching token balances for wallet: ${walletAddress} on chain: ${chainId}`);
    console.log(`API Key present: ${process.env.API_KEY ? 'YES' : 'NO'}`);
    
    const response = await axios.get(`https://api.1inch.dev/balance/v1.2/${chainId}/balances/${walletAddress}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Balance API response status: ${response.status}`);
    console.log(`Raw balance data:`, response.data);
    
    // Filter out zero balances and get token metadata
    const tokenBalances = response.data;
    const nonZeroBalances = {};
    
    console.log(`Total tokens found: ${Object.keys(tokenBalances).length}`);
    
    for (const [tokenAddress, balance] of Object.entries(tokenBalances)) {
      const balanceNum = parseFloat(balance);
      console.log(`Token ${tokenAddress}: balance = ${balance} (${balanceNum})`);
      if (balanceNum > 0) {
        nonZeroBalances[tokenAddress] = balance;
        console.log(`✓ Added to non-zero list: ${tokenAddress}`);
      }
    }
    
    console.log(`Non-zero balance tokens: ${Object.keys(nonZeroBalances).length}`);
    console.log(`Non-zero balances:`, nonZeroBalances);
    console.log(`Will fetch metadata: ${Object.keys(nonZeroBalances).length > 0 ? 'YES' : 'NO'}`);
    
    // Get token metadata for non-zero balances using the token API
    const tokensWithMetadata = {};
    
            if (Object.keys(nonZeroBalances).length > 0) {
      console.log(`\n=== FETCHING METADATA ===`);
      try {
        // Use individual token calls to get metadata
        for (const [tokenAddress, balance] of Object.entries(nonZeroBalances)) {
          try {
            const formattedAddress = tokenAddress.toLowerCase();
            const metadataUrl = `https://api.1inch.dev/token/v1.2/${chainId}/custom/${formattedAddress}`;
            console.log(`\n--- Fetching metadata for token: ${formattedAddress} ---`);
            console.log(`Full URL: ${metadataUrl}`);
            console.log(`Chain ID: ${chainId}`);
            console.log(`Original address: ${tokenAddress}`);
            console.log(`Formatted address: ${formattedAddress}`);
            
            const metadataResponse = await axios.get(metadataUrl, {
              headers: {
                'Authorization': `Bearer ${process.env.API_KEY}`,
                'Accept': 'application/json'
              }
            });
            
            console.log(`Metadata API response status: ${metadataResponse.status}`);
            console.log(`Metadata response for ${formattedAddress}:`, metadataResponse.data);
            console.log(`Response headers:`, metadataResponse.headers);
            const tokenInfo = metadataResponse.data;
            
            tokensWithMetadata[tokenAddress] = {
              balance: balance,
              name: tokenInfo.name || 'Unknown Token',
              symbol: tokenInfo.symbol || 'UNKNOWN',
              decimals: tokenInfo.decimals || 18,
              logoURI: tokenInfo.logoURI || null
            };
          } catch (tokenError) {
            console.log(`❌ ERROR fetching metadata for token ${tokenAddress}:`);
            console.log(`Error message: ${tokenError.message}`);
            console.log(`Error status: ${tokenError.response?.status}`);
            console.log(`Error data: ${tokenError.response?.data}`);
            console.log(`Error config:`, tokenError.config);
            // Fallback for individual token
            tokensWithMetadata[tokenAddress] = {
              balance: balance,
              name: 'Unknown Token',
              symbol: 'UNKNOWN',
              decimals: 18,
              logoURI: null
            };
          }
        }
      } catch (metadataError) {
        console.log(`Could not fetch metadata for tokens:`, metadataError.message);
        // Fallback with basic info for all tokens
        for (const [tokenAddress, balance] of Object.entries(nonZeroBalances)) {
          tokensWithMetadata[tokenAddress] = {
            balance: balance,
            name: 'Unknown Token',
            symbol: 'UNKNOWN',
            decimals: 18,
            logoURI: null
          };
        }
      }
    }
    
    console.log(`\n=== FINAL RESULT ===`);
    console.log(`Processed token balances with metadata:`, JSON.stringify(tokensWithMetadata, null, 2));
    console.log(`=== END DEBUG ===\n`);
    res.json(tokensWithMetadata);
    
  } catch (error) {
    console.error("Token Balance API Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching token balances" });
  }
});

// Transaction Traces API endpoints
// app.get("/traces/synced-interval", async (req, res) => {
//   try {
//     const { chainId = 1 } = req.query;
    
//     console.log(`Fetching synced interval for chain: ${chainId}`);
    
//     const response = await axios.get(`https://api.1inch.dev/traces/v1.0/chain/${chainId}/synced-interval`, {
//       headers: {
//         'Authorization': `Bearer ${process.env.API_KEY}`,
//         'Accept': 'application/json'
//       }
//     });
    
//     console.log(`Synced interval response status: ${response.status}`);
//     res.json(response.data);
    
//   } catch (error) {
//     console.error("Traces API Error:", error.response?.data || error.message);
//     res.status(500).json({ message: "Error fetching synced interval" });
//   }
// });

app.get("/traces/block-trace", async (req, res) => {
  try {
    const { chainId = 1, blockNumber } = req.query;
    
    if (!blockNumber) {
      return res.status(400).json({ error: "Block number is required" });
    }
    
    console.log(`Fetching block trace for chain: ${chainId}, block: ${blockNumber}`);
    
    const response = await axios.get(`https://api.1inch.dev/traces/v1.0/chain/${chainId}/block-trace/${blockNumber}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Block trace response status: ${response.status}`);
    res.json(response.data);
    
  } catch (error) {
    console.error("Traces API Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching block trace" });
  }
});

app.get("/traces/transaction-trace", async (req, res) => {
  try {
    const { chainId = 1, blockNumber, txHash } = req.query;
    
    if (!blockNumber || !txHash) {
      return res.status(400).json({ error: "Block number and transaction hash are required" });
    }
    
    console.log(`Fetching transaction trace for chain: ${chainId}, block: ${blockNumber}, tx: ${txHash}`);
    
    const response = await axios.get(`https://api.1inch.dev/traces/v1.0/chain/${chainId}/block-trace/${blockNumber}/tx-hash/${txHash}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Transaction trace response status: ${response.status}`);
    res.json(response.data);
    
  } catch (error) {
    console.error("Traces API Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching transaction trace" });
  }
});

// History API endpoints
app.get("/history/wallet", async (req, res) => {
  try {
    const { address, chainId = 1, limit = 10 } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: "Wallet address is required" });
    }
    
    console.log(`Fetching wallet history for address: ${address} on chain: ${chainId}, limit: ${limit}`);
    
    const response = await axios.get(`https://api.1inch.dev/history/v2.0/history/${address}/events`, {
      params: {
        chainId: parseInt(chainId),
        limit: parseInt(limit)
      },
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`History response status: ${response.status}`);
    res.json(response.data);
    
  } catch (error) {
    console.error("History API Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching wallet history" });
  }
});

// Spot Price API endpoints
app.get("/spot-prices/whitelisted", async (req, res) => {
  try {
    const { chainId = 1 } = req.query;
    
    console.log(`Fetching whitelisted token prices for chain: ${chainId}`);
    
    const response = await axios.get(`https://api.1inch.dev/price/v1.1/${chainId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Whitelisted prices response status: ${response.status}`);
    res.json(response.data);
    
  } catch (error) {
    console.error("Spot Price API Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching whitelisted token prices" });
  }
});

app.post("/spot-prices/requested", async (req, res) => {
  try {
    const { chainId = 1 } = req.query;
    const { tokens } = req.body;
    
    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: "Tokens array is required" });
    }
    
    console.log(`Fetching requested token prices for chain: ${chainId}, tokens:`, tokens);
    
    const response = await axios.post(`https://api.1inch.dev/price/v1.1/${chainId}`, {
      tokens: tokens
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Requested prices response status: ${response.status}`);
    res.json(response.data);
    
  } catch (error) {
    console.error("Spot Price API Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching requested token prices" });
  }
});

app.get("/spot-prices/addresses", async (req, res) => {
  try {
    const { chainId = 1, addresses } = req.query;
    
    if (!addresses) {
      return res.status(400).json({ error: "Addresses parameter is required" });
    }
    
    const addressArray = addresses.split(',');
    console.log(`Fetching prices for addresses on chain: ${chainId}, addresses:`, addressArray);
    
    const response = await axios.get(`https://api.1inch.dev/price/v1.1/${chainId}/${addresses}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Addresses prices response status: ${response.status}`);
    res.json(response.data);
    
  } catch (error) {
    console.error("Spot Price API Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching token prices for addresses" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// We will route all other requests to the frontend build
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${process.env.API_KEY ? 'Yes' : 'No'}`);
}); 