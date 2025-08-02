import React, { useState, useEffect } from "react";
import { DollarSign, Search, AlertCircle, RefreshCw } from "lucide-react";
import { useChainId } from "wagmi";
import { weiToUSD } from "./priceUtils";

interface TokenPrice {
  [tokenAddress: string]: string;
}

const SpotPrices: React.FC = () => {
  const chainId = useChainId();
  
  const [addressPrices, setAddressPrices] = useState<TokenPrice | null>(null);
  const [usdPrices, setUsdPrices] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAddresses, setCustomAddresses] = useState<string>('');

  const fetchAddressPrices = async () => {
    if (!chainId || chainId <= 0) {
      setError("Invalid chain ID");
      setAddressPrices(null); // Clear old prices
      setUsdPrices({}); // Clear old USD prices
      return;
    }
    
    if (!customAddresses.trim()) {
      setError("Please enter token addresses");
      setAddressPrices(null); // Clear old prices
      setUsdPrices({}); // Clear old USD prices
      return;
    }
    
    setLoading(true);
    setError(null);
    setAddressPrices(null); // Clear old prices when starting new fetch
    setUsdPrices({}); // Clear old USD prices
    
    try {
      console.log("Fetching address prices for chain:", chainId, "addresses:", customAddresses);
      const response = await fetch(`http://localhost:5000/spot-prices/addresses?chainId=${chainId}&addresses=${encodeURIComponent(customAddresses)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch address prices:", errorText);
        throw new Error(`Failed to fetch address prices: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Address prices data:", data);
      setAddressPrices(data);
      
      // Convert prices to USD
      const newUsdPrices: {[key: string]: string} = {};
      for (const [address, price] of Object.entries(data)) {
        try {
          const usdPrice = await weiToUSD(price as string, chainId);
          newUsdPrices[address] = usdPrice;
        } catch (error) {
          console.error(`Error converting price for ${address}:`, error);
          newUsdPrices[address] = '$0.00';
        }
      }
      setUsdPrices(newUsdPrices);
    } catch (error: any) {
      console.error("Error fetching address prices:", error);
      setError(error.message || "Failed to fetch token prices for addresses");
      setAddressPrices(null); // Clear old prices on error
      setUsdPrices({}); // Clear old USD prices on error
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Token Prices</h3>
        <div className="flex items-center space-x-2">
          <span className="text-white/60 text-sm">
            Chain ID: {chainId ? chainId : 'Not connected'}
          </span>
          <button 
            onClick={fetchAddressPrices}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-3 py-1 rounded-lg text-xs transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <div>
          <input
            type="text"
            placeholder="Enter token address)"
            value={customAddresses}
            onChange={(e) => setCustomAddresses(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <button
          onClick={fetchAddressPrices}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
        >
          <Search className="w-4 h-4" />
          <span>Get Prices</span>
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading token prices...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {addressPrices && (
        <div className="space-y-3">
          {Object.entries(addressPrices).map(([address, price]) => (
            <div key={address} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">{formatAddress(address)}</p>
                    <p className="text-white/60 text-xs">Token Address</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{usdPrices[address] || 'Loading...'}</p>
                  <p className="text-white/60 text-xs">Price (USD)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpotPrices; 