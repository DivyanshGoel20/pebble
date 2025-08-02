import React, { useState, useEffect } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { ArrowRight, RefreshCw, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

interface SwapQuote {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasLimit: string;
}

const SwapInterface: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const chain = config.chains.find(c => c.id === chainId);

  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [allowance, setAllowance] = useState<string>("0");
  const [allowanceLoading, setAllowanceLoading] = useState(false);

  // Common token addresses for different chains
  const getCommonTokens = (): Token[] => {
    switch (chainId) {
      case 1: // Ethereum
        return [
          { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18, name: "Ethereum" },
          { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6, name: "Tether USD" },
          { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6, name: "USD Coin" },
          { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", decimals: 8, name: "Wrapped Bitcoin" }
        ];
      case 137: // Polygon
        return [
          { address: "0x0000000000000000000000000000000000001010", symbol: "MATIC", decimals: 18, name: "Polygon" },
          { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", decimals: 6, name: "Tether USD" },
          { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", decimals: 6, name: "USD Coin" },
          { address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", symbol: "WBTC", decimals: 8, name: "Wrapped Bitcoin" }
        ];
      case 42161: // Arbitrum
        return [
          { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18, name: "Ethereum" },
          { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", symbol: "USDT", decimals: 6, name: "Tether USD" },
          { address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", symbol: "USDC", decimals: 6, name: "USD Coin" },
          { address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", symbol: "WBTC", decimals: 8, name: "Wrapped Bitcoin" }
        ];
      case 8453: // Base
        return [
          { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18, name: "Ethereum" },
          { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, name: "USD Coin" },
          { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, name: "Wrapped Ethereum" }
        ];
      case 43114: // Avalanche
        return [
          { address: "0x0000000000000000000000000000000000000000", symbol: "AVAX", decimals: 18, name: "Avalanche" },
          { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", symbol: "USDT", decimals: 6, name: "Tether USD" },
          { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", symbol: "USDC", decimals: 6, name: "USD Coin" }
        ];
      case 100: // Gnosis
        return [
          { address: "0x0000000000000000000000000000000000000000", symbol: "XDAI", decimals: 18, name: "xDai" },
          { address: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6", symbol: "USDT", decimals: 6, name: "Tether USD" },
          { address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", symbol: "USDC", decimals: 6, name: "USD Coin" }
        ];
      default:
        return [];
    }
  };

  const commonTokens = getCommonTokens();

  const checkAllowance = async () => {
    if (!address || !fromToken || !chainId) return;

    setAllowanceLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/swap/allowance?tokenAddress=${fromToken}&walletAddress=${address}&chainId=${chainId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAllowance(data.allowance || "0");
      } else {
        console.error("Failed to check allowance");
        setAllowance("0");
      }
    } catch (error) {
      console.error("Error checking allowance:", error);
      setAllowance("0");
    } finally {
      setAllowanceLoading(false);
    }
  };

  const getSwapQuote = async () => {
    if (!address || !fromToken || !toToken || !amount || !chainId) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      const params = new URLSearchParams({
        src: fromToken,
        dst: toToken,
        amount: amount,
        from: address,
        chainId: chainId.toString(),
        slippage: slippage
      });

      const response = await fetch(`http://localhost:5000/api/swap/quote?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setQuote(data.tx);
        console.log("Swap quote:", data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to get swap quote");
      }
    } catch (error) {
      console.error("Error getting swap quote:", error);
      setError("Failed to get swap quote");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) return;

    setLoading(true);
    try {
      // Here you would typically use wagmi's useWriteContract or similar
      // to send the transaction with the quote data
      console.log("Executing swap with quote:", quote);
      
      // For now, we'll just show a success message
      setError(null);
      alert("Swap transaction prepared! Check your wallet to confirm.");
    } catch (error) {
      console.error("Error executing swap:", error);
      setError("Failed to execute swap");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromToken && address && chainId) {
      checkAllowance();
    }
  }, [fromToken, address, chainId]);

  if (!address) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Token Swap</h3>
        <p className="text-white/60 text-center">Connect your wallet to start swapping tokens</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Token Swap</h3>
        <div className="flex items-center space-x-2">
          {chain && (
            <span className="text-white/60 text-sm">{chain.name}</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">From Token</label>
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select token</option>
            {commonTokens.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="w-6 h-6 text-white/60" />
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">To Token</label>
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select token</option>
            {commonTokens.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>

        {/* Slippage */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">Slippage Tolerance (%)</label>
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            placeholder="1"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Allowance Info */}
        {fromToken && (
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Current Allowance:</span>
              <div className="flex items-center space-x-2">
                {allowanceLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                ) : (
                  <span className="text-white text-sm">{allowance}</span>
                )}
                <button
                  onClick={checkAllowance}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Quote Display */}
        {quote && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Swap Quote Ready</span>
            </div>
            <div className="text-white/60 text-xs">
              <div>Gas Limit: {quote.gasLimit}</div>
              <div>Gas Price: {quote.gasPrice}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={getSwapQuote}
            disabled={loading || !fromToken || !toToken || !amount}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Get Quote</span>
          </button>

          {quote && (
            <button
              onClick={handleSwap}
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {loading ? "Processing..." : "Execute Swap"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapInterface; 