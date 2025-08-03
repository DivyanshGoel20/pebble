import React, { useState, useEffect } from "react";
import { Zap, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useChainId, useConfig } from "wagmi";

interface GasPrice {
  baseFee: string;
  low: {
    maxPriorityFeePerGas: string;
    maxFeePerGas: string;
  };
  medium: {
    maxPriorityFeePerGas: string;
    maxFeePerGas: string;
  };
  high: {
    maxPriorityFeePerGas: string;
    maxFeePerGas: string;
  };
  instant: {
    maxPriorityFeePerGas: string;
    maxFeePerGas: string;
  };
}

const GasPrice: React.FC = () => {
  const chainId = useChainId();
  const config = useConfig();
  const chain = config.chains.find(c => c.id === chainId);
  const [gasPrice, setGasPrice] = useState<GasPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGasPrice = async () => {
    if (!chainId) {
      console.log("No chainId available");
      return;
    }
    
    console.log("Fetching gas prices for chainId:", chainId);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/gas-price?chainId=${chainId}`);
      console.log("Gas price response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gas price error response:", errorText);
        throw new Error("Failed to fetch gas prices");
      }
      
      const data = await response.json();
      // console.log("Gas price data received:", data);
      // console.log("Setting gasPrice state to:", data);
      setGasPrice(data);
      // console.log("gasPrice state should now be set");
    } catch (error) {
      console.error("Error fetching gas price:", error);
      setError("Failed to fetch gas prices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chainId) {
      fetchGasPrice();
    }
    
    // Refresh gas prices every 30 seconds
    const interval = setInterval(() => {
      if (chainId) {
        fetchGasPrice();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [chainId]);

  // Debug useEffect to monitor gasPrice changes
  useEffect(() => {
    // console.log("gasPrice state changed:", gasPrice);
  }, [gasPrice]);

  // Format gwei values for display (server converts wei to gwei)
  const formatGwei = (gweiValue: string) => {
    const gwei = parseFloat(gweiValue);
    return gwei.toFixed(2);
  };

  const getGasLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-orange-400";
      case "instant":
        return "text-red-400";
      default:
        return "text-white";
    }
  };

  const getGasLevelIcon = (level: string) => {
    switch (level) {
      case "low":
        return <TrendingDown className="w-4 h-4" />;
      case "medium":
        return <Clock className="w-4 h-4" />;
      case "high":
        return <TrendingUp className="w-4 h-4" />;
      case "instant":
        return <Zap className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Gas Prices</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading gas prices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Gas Prices</h3>
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">Error loading gas prices</p>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchGasPrice}
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
        <h3 className="text-lg font-semibold text-white">Gas Prices</h3>
        <div className="flex items-center space-x-2">
          {chain && (
            <span className="text-white/60 text-sm">{chain.name}</span>
          )}
          <button 
            onClick={fetchGasPrice}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {gasPrice && gasPrice.baseFee ? (
        <div className="space-y-4">
          {/* Base Fee */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Base Fee</span>
              <span className="text-white font-medium">
                {formatGwei(gasPrice.baseFee)} Gwei
              </span>
            </div>
            <div className="text-xs text-white/40">
              Raw: {gasPrice.baseFee} Gwei
            </div>
          </div>

          {/* Gas Levels */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries({ 
              low: gasPrice.low, 
              medium: gasPrice.medium, 
              high: gasPrice.high, 
              instant: gasPrice.instant 
            }).map(([level, data]) => {
              // Add safety check for data
              if (!data || !data.maxPriorityFeePerGas || !data.maxFeePerGas) {
                return (
                  <div 
                    key={level}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getGasLevelIcon(level)}
                        <span className={`text-sm font-medium capitalize ${getGasLevelColor(level)}`}>
                          {level}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">No data available</div>
                  </div>
                );
              }

              return (
                <div 
                  key={level}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getGasLevelIcon(level)}
                      <span className={`text-sm font-medium capitalize ${getGasLevelColor(level)}`}>
                        {level}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Priority:</span>
                      <span className="text-white">{formatGwei(data.maxPriorityFeePerGas)} Gwei</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Max Fee:</span>
                      <span className="text-white">{formatGwei(data.maxFeePerGas)} Gwei</span>
                    </div>
                    <div className="text-xs text-white/30 mt-1">
                    Raw Priority Fee: {data.maxPriorityFeePerGas} Gwei
                    </div>
                    <div className="text-xs text-white/30 mt-1">
                    Raw Max Fee: {data.maxFeePerGas} Gwei
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <p className="text-white/40 text-xs">
              Auto-refreshes every 30 seconds
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-white/60">No gas price data available</p>
          <p className="text-white/40 text-sm">Switch to a supported network</p>
        </div>
      )}
    </div>
  );
};

export default GasPrice;