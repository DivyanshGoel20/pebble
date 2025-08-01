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
    console.log(`Fetching NFTs for address: ${address}, chainIds: ${chainIds}`);
    
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
    
    console.log(`Gas price response for chain ${chainId}:`, JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error(`Gas Price API Error for chain ${req.query.chainId}:`, error.response?.data || error.message);
    console.error("Error Status:", error.response?.status);
    res.status(500).json({ message: "Error fetching gas prices" });
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