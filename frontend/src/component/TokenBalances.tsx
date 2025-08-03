import React, { useState, useEffect } from "react";
import { Wallet, RefreshCw, AlertCircle } from "lucide-react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { weiToUSDNumber } from "./priceUtils";

interface TokenMetadata {
  balance: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
}

interface TokenBalances {
  [tokenAddress: string]: TokenMetadata;
}

const TokenBalances: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const chain = config.chains.find(c => c.id === chainId);
  const [tokenBalances, setTokenBalances] = useState<TokenBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenPrices, setTokenPrices] = useState<{[key: string]: number}>({});

  const fetchTokenBalances = async () => {
    if (!address || !isConnected) {
      console.log("No wallet connected");
      return;
    }
    
    console.log("Fetching token balances for address:", address);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://pebble-19ip.onrender.com/token-balances?walletAddress=${address}&chainId=${chainId}`);
      console.log("Token balance response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Token balance error response:", errorText);
        throw new Error("Failed to fetch token balances");
      }
      
      const data = await response.json();
      console.log("Token balance data received:", data);
      setTokenBalances(data);
      
      // Fetch prices for tokens if we have balances
      if (data && Object.keys(data).length > 0) {
        await fetchTokenPrices(Object.keys(data));
      }
    } catch (error) {
      console.error("Error fetching token balances:", error);
      setError("Failed to fetch token balances");
      setTokenBalances(null); // Clear old balances on error
      setTokenPrices({}); // Clear old prices on error
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenPrices = async (tokenAddresses: string[]) => {
    if (!chainId || chainId <= 0 || tokenAddresses.length === 0) {
      return;
    }
    
    try {
      console.log("Fetching token prices for addresses:", tokenAddresses);
      const response = await fetch(`https://pebble-19ip.onrender.com/spot-prices/addresses?chainId=${chainId}&addresses=${encodeURIComponent(tokenAddresses.join(','))}`);
      
      if (!response.ok) {
        console.error("Failed to fetch token prices:", response.status);
        setTokenPrices({}); // Clear old prices on error
        return;
      }
      
      const data = await response.json();
      console.log("Token prices data:", data);
      
      // Convert prices to USD format using the utility function
      const usdPrices: {[key: string]: number} = {};
      for (const [address, price] of Object.entries(data)) {
        try {
          const usdPrice = await weiToUSDNumber(price as string, chainId);
          usdPrices[address] = usdPrice;
        } catch (error) {
          console.error(`Error converting price for ${address}:`, error);
          usdPrices[address] = 0;
        }
      }
      
      setTokenPrices(usdPrices);
    } catch (error) {
      console.error("Error fetching token prices:", error);
      setTokenPrices({}); // Clear old prices on error
    }
  };

  useEffect(() => {
    if (address && isConnected) {
      fetchTokenBalances();
    }
  }, [address, chainId, isConnected]);

  // Format token balance for display with proper decimals
  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    
    // Convert from wei to actual token amount
    const actualAmount = num / Math.pow(10, decimals);
    
    if (actualAmount < 0.0001) return "< 0.0001";
    if (actualAmount < 1) return actualAmount.toFixed(6);
    if (actualAmount < 1000) return actualAmount.toFixed(4);
    if (actualAmount < 1000000) return actualAmount.toFixed(2);
    return actualAmount.toFixed(0);
  };

  // Shorten wallet address for display
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate USD value
  const calculateUSDValue = (balance: string, decimals: number, tokenAddress: string) => {
    const actualAmount = parseFloat(balance) / Math.pow(10, decimals);
    const pricePerToken = tokenPrices[tokenAddress] || 0;
    const usdValue = actualAmount * pricePerToken;
    return usdValue > 0 ? `$${usdValue.toFixed(2)}` : '';
  };

  if (!isConnected) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Token Balances</h3>
        <div className="text-center py-8">
          <Wallet className="w-8 h-8 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">Connect your wallet to view token balances</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Token Balances</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading token balances...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Token Balances</h3>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Error loading token balances</p>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchTokenBalances}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Token Balances</h3>
        <div className="flex items-center space-x-2">
          {chain && (
            <span className="text-white/60 text-sm">{chain.name}</span>
          )}
          <button 
            onClick={fetchTokenBalances}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {tokenBalances ? (
        <div className="space-y-3">
          {Object.entries(tokenBalances).length > 0 ? (
            Object.entries(tokenBalances).map(([tokenAddress, tokenData]) => (
              <div 
                key={tokenAddress}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {tokenData.logoURI && (
                        <img 
                          src={tokenData.logoURI} 
                          alt={tokenData.name}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div className="text-white font-medium text-sm">
                          {tokenData.name}
                        </div>
                        <div className="text-white/60 text-xs">
                          {tokenData.symbol} • {shortenAddress(tokenAddress)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {formatBalance(tokenData.balance, tokenData.decimals)} {tokenData.symbol}
                    </div>
                    {calculateUSDValue(tokenData.balance, tokenData.decimals, tokenAddress) && (
                      <div className="text-white/60 text-xs">
                        {calculateUSDValue(tokenData.balance, tokenData.decimals, tokenAddress)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-white/60">No tokens found in this wallet</p>
              <p className="text-white/40 text-sm">Try switching networks or check your wallet</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-white/60">No token balance data available</p>
          <p className="text-white/40 text-sm">Connect to a supported network</p>
        </div>
      )}
    </div>
  );
};

export default TokenBalances; 