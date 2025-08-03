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

// Domain API endpoints
const DOMAIN_BASE_URL = "https://api.1inch.dev/domains/v2.0";

// Retrieve domain information
app.get("/api/:domain/info", async (req, res) => {
  try {
    const { domain } = req.params;
    console.log(`Domain lookup request for: ${domain}`);
    
    // Use 'name' parameter instead of 'domain'
    const apiUrl = `${DOMAIN_BASE_URL}/lookup?name=${encodeURIComponent(domain)}`;
    console.log(`Calling 1inch API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
    });
    
    console.log(`Domain API response status: ${response.status}`);
    console.log(`Domain API response data:`, response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error("Domain API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    console.error("Error config:", error.config);
    
    res.status(500).json({
      error: "Failed to fetch domain information",
      details: error.response?.data || error.message
    });
  }
});

app.get("/api/:domain/reverseinfo", async (req, res) => {
  try {
    const { domain } = req.params;
    console.log(`Domain reverse lookup request for: ${domain}`);
    
    // Use 'address' parameter for reverse lookup
    const apiUrl = `${DOMAIN_BASE_URL}/reverse-lookup?address=${encodeURIComponent(domain)}`;
    console.log(`Calling 1inch API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
    });
    
    console.log(`Domain reverse API response status: ${response.status}`);
    console.log(`Domain reverse API response data:`, response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error("Domain Reverse API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    console.error("Error config:", error.config);
    
    res.status(500).json({
      error: "Failed to fetch domain reverse information",
      details: error.response?.data || error.message
    });
  }
});

// Retrieve provider data with avatars
app.get("/api/providers-data-with-avatar", async (req, res) => {
  try {
    console.log(`Provider data request`);
    const constructedUrl = `${DOMAIN_BASE_URL}/get-providers-data-with-avatar`;
    console.log(`Calling 1inch API: ${constructedUrl}`);
    
    const response = await axios.get(constructedUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
    });
    
    console.log(`1inch Domain API response status: ${response.status}`);
    console.log(`1inch Domain API response data:`, response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error("Domain API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    console.error("Error config:", error.config);
    
    res.status(500).json({ 
      error: "Failed to fetch provider data",
      details: error.response?.data || error.message
    });
  }
});

// Swap API endpoints
const SWAP_BASE_URL = "https://api.1inch.dev/swap/v6.1";

// Check token allowance
app.get("/api/swap/allowance", async (req, res) => {
  try {
    const { tokenAddress, walletAddress, chainId } = req.query;
    
    if (!tokenAddress || !walletAddress || !chainId) {
      return res.status(400).json({ error: "Missing required parameters: tokenAddress, walletAddress, chainId" });
    }

    console.log(`Checking allowance for token: ${tokenAddress}, wallet: ${walletAddress}, chain: ${chainId}`);
    
    const apiUrl = `${SWAP_BASE_URL}/${chainId}/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`;
    console.log(`Calling 1inch API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
    });
    
    console.log(`Allowance API response status: ${response.status}`);
    console.log(`Allowance API response data:`, response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error("Allowance API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    
    res.status(500).json({
      error: "Failed to check token allowance",
      details: error.response?.data || error.message
    });
  }
});

// Get approval transaction
app.get("/api/swap/approve", async (req, res) => {
  try {
    const { tokenAddress, amount, chainId } = req.query;
    
    if (!tokenAddress || !amount || !chainId) {
      return res.status(400).json({ error: "Missing required parameters: tokenAddress, amount, chainId" });
    }

    console.log(`Getting approval transaction for token: ${tokenAddress}, amount: ${amount}, chain: ${chainId}`);
    
    const apiUrl = `${SWAP_BASE_URL}/${chainId}/approve/transaction?tokenAddress=${tokenAddress}&amount=${amount}`;
    console.log(`Calling 1inch API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
    });
    
    console.log(`Approval API response status: ${response.status}`);
    console.log(`Approval API response data:`, response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error("Approval API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    
    res.status(500).json({
      error: "Failed to get approval transaction",
      details: error.response?.data || error.message
    });
  }
});

// Get best quote
app.get("/api/swap/best-quote", async (req, res) => {
  try {
    const { src, dst, amount, chainId } = req.query;
    
    if (!src || !dst || !amount || !chainId) {
      return res.status(400).json({ error: "Missing required parameters: src, dst, amount, chainId" });
    }

    console.log(`Getting best quote for: ${src} -> ${dst}, amount: ${amount}, chain: ${chainId}`);
    
    const config = {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
      params: {
        src: src,
        dst: dst,
        amount: amount
      },
      paramsSerializer: {
        indexes: null
      }
    };
    
    const apiUrl = `${SWAP_BASE_URL}/${chainId}/quote`;
    console.log(`Calling 1inch API: ${apiUrl}`);
    console.log(`With params:`, config.params);
    
    const response = await axios.get(apiUrl, config);
    
    console.log(`Best quote API response status: ${response.status}`);
    console.log(`Best quote API response data:`, response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error("Best Quote API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    
    res.status(500).json({
      error: "Failed to get best quote",
      details: error.response?.data || error.message
    });
  }
});

// Get quote (best price)
app.get("/api/swap/quote", async (req, res) => {
  try {
    const { src, dst, amount, chainId } = req.query;
    
    if (!src || !dst || !amount || !chainId) {
      return res.status(400).json({ error: "Missing required parameters: src, dst, amount, chainId" });
    }

    console.log(`Getting quote for: ${src} -> ${dst}, amount: ${amount}, chain: ${chainId}`);
    
    // Use the exact format from your example
    const config = {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
      params: {
        src: src,
        dst: dst,
        amount: amount
      },
      paramsSerializer: {
        indexes: null
      }
    };
    
    const apiUrl = `${SWAP_BASE_URL}/${chainId}/quote`;
    console.log(`Calling 1inch API: ${apiUrl}`);
    console.log(`With params:`, config.params);
    
    const response = await axios.get(apiUrl, config);
    
    console.log(`Quote API response status: ${response.status}`);
    console.log(`Quote API response data:`, response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error("Quote API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    
    res.status(500).json({
      error: "Failed to get quote",
      details: error.response?.data || error.message
    });
  }
});

// Get swap transaction 
app.get("/api/swap/transaction", async (req, res) => {
  try {
    const { src, dst, amount, from, chainId, slippage = "1" } = req.query;
    
    if (!src || !dst || !amount || !from || !chainId) {
      return res.status(400).json({ error: "Missing required parameters: src, dst, amount, from, chainId" });
    }

    console.log(`Getting swap transaction for: ${src} -> ${dst}, amount: ${amount}, from: ${from}, chain: ${chainId}, slippage: ${slippage}`);
    console.log(`API Key present: ${!!process.env.API_KEY}`);
    
    // Validate slippage between 1 and 50
    const slippageNum = parseInt(slippage);
    console.log(`Slippage validation: ${slippage} -> ${slippageNum}%`);
    if (slippageNum < 1 || slippageNum > 50) {
      return res.status(400).json({ error: "Slippage must be between 1 and 50" });
    }

    // Use the exact format from the working example
    const params = {
      src: src,
      dst: dst,
      amount: amount,
      from: from,
      origin: from, // Important: origin should be same as from
      slippage: slippageNum
    };

    const config = {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
      params: params,
      paramsSerializer: {
        indexes: null
      }
    };
    
    const apiUrl = `${SWAP_BASE_URL}/${chainId}/swap`;
    console.log(`Calling 1inch API: ${apiUrl}`);
    console.log(`With params:`, params);
    
    const response = await axios.get(apiUrl, config);
    
    console.log(`Swap API response status: ${response.status}`);
    console.log(`Swap API response data:`, JSON.stringify(response.data, null, 2));
    
    // Check if response contains slippage information
    if (response.data && response.data.tx) {
      console.log(`Transaction details - To: ${response.data.tx.to}`);
      console.log(`Transaction details - Data length: ${response.data.tx.data ? response.data.tx.data.length : 'N/A'}`);
      console.log(`Transaction details - Value: ${response.data.tx.value}`);
      console.log(`Transaction details - Gas: ${response.data.tx.gas}`);
      console.log(`Transaction details - Gas Price: ${response.data.tx.gasPrice}`);
      
      // Check if there's any slippage info in the response
      if (response.data.slippage) {
        console.log(`1inch API returned slippage: ${response.data.slippage}`);
      }
      if (response.data.dstAmount) {
        console.log(`1inch API returned dstAmount: ${response.data.dstAmount}`);
      }
    }
    
    // The 1inch API should return the transaction data directly
    res.json(response.data);
  } catch (error) {
    console.error("Swap API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    console.error("Request config:", error.config);
    
    res.status(error.response?.status || 500).json({
      error: "Failed to get swap transaction",
      details: error.response?.data || error.message,
      apiUrl: `${SWAP_BASE_URL}/${req.query.chainId}/swap`,
      params: {
        src: req.query.src,
        dst: req.query.dst,
        amount: req.query.amount,
        from: req.query.from,
        origin: req.query.from,
        slippage: req.query.slippage
      }
    });
  }
});

// Execute swap transaction
app.post("/api/swap/execute", async (req, res) => {
  try {
    const { txData, chainId } = req.body;
    
    if (!txData || !chainId) {
      return res.status(400).json({ error: "Missing required parameters: txData, chainId" });
    }

    console.log(`Executing swap transaction on chain: ${chainId}`);
    console.log(`Transaction data:`, txData);
    
    // Import viem dynamically since it's not installed in the backend yet
    // For now, we'll return the transaction data for the frontend to handle
    // In a production environment, you'd want to install viem and handle the transaction here
    
    res.json({
      success: true,
      message: "Transaction data prepared for execution",
      txData: txData,
      chainId: chainId
    });
    
  } catch (error) {
    console.error("Swap Execution Error Details:");
    console.error("Error message:", error.message);
    
    res.status(500).json({
      error: "Failed to execute swap",
      details: error.message
    });
  }
});

// Token API endpoints
const TOKEN_BASE_URL = "https://api.1inch.dev/token";
const TOKEN_DETAILS_BASE_URL = "https://api.1inch.dev/token-details";

// Search tokens by name/symbol
app.get("/api/token/search", async (req, res) => {
  try {
    const { query, chainId, limit = 10 } = req.query;
    
    if (!query || !chainId) {
      return res.status(400).json({ error: "Missing required parameters: query, chainId" });
    }

    console.log(`Searching tokens for query: ${query}, chain: ${chainId}`);
    
    // Use the actual chain ID for token search (no override for Base/Arbitrum)
    let effectiveChainId = chainId;
    
    const params = {
      query,
      limit: parseInt(limit),
      ignore_listed: "false"
    };
    
    const apiUrl = `${TOKEN_BASE_URL}/v1.2/${effectiveChainId}/search`;
    console.log(`Calling 1inch Token API: ${apiUrl}`);
    console.log(`With params:`, params);
    
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
      params: params
    });
    
    console.log(`Token search API response status: ${response.status}`);
    console.log(`Token search API response data:`, response.data);
    
    // Check if we have tokens in the response
    if (response.data && response.data.tokens) {
      console.log(`Found ${response.data.tokens.length} tokens`);
      response.data.tokens.forEach((token, index) => {
        console.log(`Token ${index + 1}: ${token.name} (${token.symbol}) - ${token.address}`);
      });
    } else {
      console.log(`No tokens found in response`);
    }
    
    res.json(response.data);
  } catch (error) {
    console.error("Token Search API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    
    res.status(500).json({
      error: "Failed to search tokens",
      details: error.response?.data || error.message
    });
  }
});

// Get native token details by chain ID
app.get("/api/token-details/native/:chainId", async (req, res) => {
  try {
    const { chainId } = req.params;
    
    if (!chainId) {
      return res.status(400).json({ error: "Missing required parameter: chainId" });
    }

    // For Base and Arbitrum, use Ethereum (chainId 1) to fetch ETH details
    let effectiveChainId = chainId;
    if (chainId === "8453" || chainId === "42161") {
      effectiveChainId = "1";
      console.log(`Base/Arbitrum detected, using Ethereum chainId (1) for native token details`);
    }

    console.log(`Getting native token details for chain: ${chainId} (effective: ${effectiveChainId})`);
    
    const apiUrl = `${TOKEN_DETAILS_BASE_URL}/v1.0/details/${effectiveChainId}`;
    console.log(`Calling 1inch Token Details API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        'Accept': 'application/json'
      },
    });
    
    console.log(`Token Details API response status: ${response.status}`);
    console.log(`Token Details API response data:`, response.data);
    
    res.json(response.data);
  } catch (error) {
    console.error("Token Details API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    
    res.status(500).json({
      error: "Failed to fetch native token details",
      details: error.response?.data || error.message
    });
  }
});

// Enhanced token search and details endpoint
app.get("/api/token-details/search", async (req, res) => {
  try {
    const { query, chainId } = req.query;
    
    if (!query || !chainId) {
      return res.status(400).json({ error: "Missing required parameters: query, chainId" });
    }

    console.log(`Enhanced token search for query: ${query}, chain: ${chainId}`);
    
    // Use the actual chain ID for token search (no override for Base/Arbitrum)
    let effectiveChainId = chainId;
    
    console.log(`Using effective chain ID: ${effectiveChainId} for token search`);

    // Check if query is an Ethereum address (starts with 0x and has 42 characters)
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(query);
    console.log(`Query "${query}" is address: ${isAddress}`);
    
    let tokenAddress;
    
    if (isAddress) {
      // If it's an address, use it directly
      console.log(`Query is an address: ${query}`);
      tokenAddress = query;
    } else {
      // If it's a name/symbol, search for it first
      console.log(`Query is a name/symbol, searching for: ${query}`);
      
      try {
        const searchUrl = `${TOKEN_BASE_URL}/v1.2/${effectiveChainId}/search`;
        console.log(`Calling Token Search API: ${searchUrl}`);
        
        const searchResponse = await axios.get(searchUrl, {
          headers: {
            Authorization: `Bearer ${process.env.API_KEY}`,
            'Accept': 'application/json'
          },
          params: {
            query: query,
            limit: 1, // Get only the first result
            ignore_listed: "false"
          }
        });
        
        console.log(`Token Search API response status: ${searchResponse.status}`);
        console.log(`Token Search API response data:`, searchResponse.data);
        
        if (searchResponse.data.tokens && searchResponse.data.tokens.length > 0) {
          tokenAddress = searchResponse.data.tokens[0].address;
          console.log(`Found token address: ${tokenAddress}`);
          console.log(`Token details: ${searchResponse.data.tokens[0].name} (${searchResponse.data.tokens[0].symbol})`);
        } else {
          console.log(`No tokens found in search response`);
          return res.status(404).json({ error: "No tokens found for the given query" });
        }
      } catch (searchError) {
        console.error("Token Search API Error:", searchError.response?.data || searchError.message);
        return res.status(500).json({
          error: "Failed to search for token",
          details: searchError.response?.data || searchError.message
        });
      }
    }
    
    // Now fetch token details using the address
    console.log(`Fetching token details for address: ${tokenAddress} on chain: ${effectiveChainId}`);
    
    const detailsUrl = `${TOKEN_DETAILS_BASE_URL}/v1.0/details/${effectiveChainId}/${tokenAddress}`;
    console.log(`Calling Token Details API: ${detailsUrl}`);
    
    try {
      const detailsResponse = await axios.get(detailsUrl, {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          'Accept': 'application/json'
        },
      });
      
      console.log(`Token Details API response status: ${detailsResponse.status}`);
      console.log(`Token Details API response data:`, detailsResponse.data);
      
      res.json(detailsResponse.data);
    } catch (detailsError) {
      console.error("Token Details API Error Details:");
      console.error("Error message:", detailsError.message);
      console.error("Error status:", detailsError.response?.status);
      console.error("Error data:", detailsError.response?.data);
      console.error("Full error:", detailsError);
      
      return res.status(500).json({
        error: "Failed to fetch token details",
        details: detailsError.response?.data || detailsError.message,
        chainId: effectiveChainId,
        tokenAddress: tokenAddress
      });
    }
    
  } catch (error) {
    console.error("Enhanced Token Details API Error Details:");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    
    res.status(500).json({
      error: "Failed to fetch token details",
      details: error.response?.data || error.message
    });
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