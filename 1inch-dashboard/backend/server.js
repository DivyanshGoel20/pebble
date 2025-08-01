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
    
    console.log(`Fetching token balances for wallet: ${walletAddress} on chain: ${chainId}`);
    
    const response = await axios.get(`https://api.1inch.dev/balance/v1.2/${chainId}/balances/${walletAddress}`, {
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Token balances response for ${walletAddress}:`, JSON.stringify(response.data, null, 2));
    
    // Filter out zero balances and get token metadata
    const tokenBalances = response.data;
    const nonZeroBalances = {};
    
    for (const [tokenAddress, balance] of Object.entries(tokenBalances)) {
      const balanceNum = parseFloat(balance);
      if (balanceNum > 0) {
        nonZeroBalances[tokenAddress] = balance;
      }
    }
    
    // Get token metadata for non-zero balances
    const tokensWithMetadata = {};
    
    for (const [tokenAddress, balance] of Object.entries(nonZeroBalances)) {
      try {
        // Get token metadata from 1inch API
        const metadataResponse = await axios.get(`https://api.1inch.dev/token/v1.2/${chainId}/metadata/${tokenAddress}`, {
          headers: {
            'Authorization': `Bearer ${process.env.API_KEY}`,
            'Accept': 'application/json'
          }
        });
        
        const metadata = metadataResponse.data;
        tokensWithMetadata[tokenAddress] = {
          balance: balance,
          name: metadata.name || 'Unknown Token',
          symbol: metadata.symbol || 'UNKNOWN',
          decimals: metadata.decimals || 18,
          logoURI: metadata.logoURI || null
        };
      } catch (metadataError) {
        console.log(`Could not fetch metadata for token ${tokenAddress}:`, metadataError.message);
        // Fallback with basic info
        tokensWithMetadata[tokenAddress] = {
          balance: balance,
          name: 'Unknown Token',
          symbol: 'UNKNOWN',
          decimals: 18,
          logoURI: null
        };
      }
    }
    
    console.log(`Processed token balances with metadata:`, JSON.stringify(tokensWithMetadata, null, 2));
    res.json(tokensWithMetadata);
    
  } catch (error) {
    console.error("Token Balance API Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Error fetching token balances" });
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