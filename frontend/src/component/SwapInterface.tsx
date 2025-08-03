import React, { useState, useEffect } from "react";
import { useAccount, useChainId, useConfig, useWalletClient, usePublicClient } from "wagmi";
import { ArrowRight, RefreshCw, AlertCircle, CheckCircle, Loader2, Search } from "lucide-react";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

interface QuoteResponse {
  dstAmount: string;
}

interface SwapTransaction {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}

interface ApprovalTransaction {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}

const SwapInterface: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const chain = config.chains.find(c => c.id === chainId);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [fromTokenInfo, setFromTokenInfo] = useState<Token | null>(null);
  const [toTokenInfo, setToTokenInfo] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [swapTransaction, setSwapTransaction] = useState<SwapTransaction | null>(null);
  const [approvalTransaction, setApprovalTransaction] = useState<ApprovalTransaction | null>(null);
  const [allowance, setAllowance] = useState<string>("0");
  const [searchingToken, setSearchingToken] = useState(false);

  // Check allowance when component mounts or when address/chainId changes
  useEffect(() => {
    if (address && chainId && fromTokenInfo) {
      checkAllowance();
    }
  }, [address, chainId, fromTokenInfo]);

  // Clear approval transaction when amount changes
  useEffect(() => {
    setApprovalTransaction(null);
  }, [amount]);

  const searchToken = async (query: string): Promise<Token | null> => {
    if (!query.trim()) return null;

    setSearchingToken(true);
    try {
      // First, check if it's a common token name/symbol
      const commonTokens: { [key: string]: Token } = {
        'eth': { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "ETH", decimals: 18, name: "Ethereum" },
        'ethereum': { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "ETH", decimals: 18, name: "Ethereum" },
        'usdt': { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6, name: "Tether USD" },
        'usdc': { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6, name: "USD Coin" },
        'wbtc': { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", decimals: 8, name: "Wrapped Bitcoin" },
        'matic': { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "MATIC", decimals: 18, name: "Polygon" },
        'polygon': { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "MATIC", decimals: 18, name: "Polygon" },
        'avax': { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "AVAX", decimals: 18, name: "Avalanche" },
        'avalanche': { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "AVAX", decimals: 18, name: "Avalanche" },
        'xdai': { address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", symbol: "XDAI", decimals: 18, name: "xDai" },
        'weth': { address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, name: "Wrapped Ethereum" }
      };

      const normalizedQuery = query.toLowerCase().trim();
      
      // Check common tokens first
      if (commonTokens[normalizedQuery]) {
        return commonTokens[normalizedQuery];
      }

      // Check if it's an Ethereum address
      const isAddress = /^0x[a-fA-F0-9]{40}$/.test(query);
      
      if (isAddress) {
        // If it's an address, get token details directly
        const response = await fetch(
          `https://pebble-19ip.onrender.com/api/token-details/search?query=${query}&chainId=${chainId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return {
            address: data.address,
            symbol: data.symbol,
            decimals: data.decimals,
            name: data.name
          };
        }
      } else {
        // If it's a name/symbol, search for it
        const response = await fetch(
          `https://pebble-19ip.onrender.com/api/token/search?query=${query}&chainId=${chainId}&limit=5`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.tokens && data.tokens.length > 0) {
            const token = data.tokens[0];
            return {
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              name: token.name
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error searching token:", error);
      return null;
    } finally {
      setSearchingToken(false);
    }
  };

  const handleFromTokenSearch = async (query: string) => {
    setFromToken(query);
    setFromTokenInfo(null);
    setQuote(null);
    setSwapTransaction(null);
    setApprovalTransaction(null);
    
    if (query.trim()) {
      const token = await searchToken(query);
      if (token) {
        setFromTokenInfo(token);
        setFromToken(token.address);
        // Check allowance for the new token
        setTimeout(() => checkAllowance(), 100);
      }
    }
  };

  const handleToTokenSearch = async (query: string) => {
    setToToken(query);
    setToTokenInfo(null);
    setQuote(null);
    setSwapTransaction(null);
    
    if (query.trim()) {
      const token = await searchToken(query);
      if (token) {
        setToTokenInfo(token);
        setToToken(token.address);
      }
    }
  };

  const getSwapQuote = async () => {
    if (!fromTokenInfo || !toTokenInfo || !amount || !chainId || !address) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    setQuote(null);
    setSwapTransaction(null);

    try {
      // Convert amount to the proper format (wei/smallest unit)
      let formattedAmount: string;
      if (fromTokenInfo.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        // Native token (ETH, MATIC, etc.)
        formattedAmount = parseEther(amount).toString();
      } else {
        // ERC20 token
        formattedAmount = parseUnits(amount, fromTokenInfo.decimals).toString();
      }

      console.log("Quote parameters:", {
        src: fromTokenInfo.address,
        dst: toTokenInfo.address,
        amount: formattedAmount,
        chainId: chainId.toString()
      });

      const params = new URLSearchParams({
        src: fromTokenInfo.address,
        dst: toTokenInfo.address,
        amount: formattedAmount,
        chainId: chainId.toString()
      });

      const response = await fetch(`https://pebble-19ip.onrender.com/api/swap/quote?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Quote response:", data);
        
        if (data.dstAmount) {
          setQuote(data);
          console.log("Quote received:", data);
        } else {
          console.error("Unexpected response structure:", data);
          setError("Unexpected response structure from quote API");
        }
      } else {
        const errorData = await response.json();
        console.error("Quote API error:", errorData);
        setError(errorData.error || "Failed to get quote");
      }
    } catch (error) {
      console.error("Error getting quote:", error);
      setError("Failed to get quote");
    } finally {
      setLoading(false);
    }
  };

  const getSwapTransaction = async () => {
    if (!fromTokenInfo || !toTokenInfo || !amount || !chainId || !address) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    setSwapTransaction(null);

    try {
      // Convert amount to the proper format (wei/smallest unit)
      let formattedAmount: string;
      if (fromTokenInfo.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        // Native token (ETH, MATIC, etc.)
        formattedAmount = parseEther(amount).toString();
      } else {
        // ERC20 token
        formattedAmount = parseUnits(amount, fromTokenInfo.decimals).toString();
      }

      console.log("Transaction parameters:", {
        src: fromTokenInfo.address,
        dst: toTokenInfo.address,
        amount: formattedAmount,
        from: address,
        chainId: chainId.toString(),
        slippage: slippage
      });

      const params = new URLSearchParams({
        src: fromTokenInfo.address,
        dst: toTokenInfo.address,
        amount: formattedAmount,
        from: address,
        chainId: chainId.toString(),
        slippage: slippage
      });

      const response = await fetch(`https://pebble-19ip.onrender.com/api/swap/transaction?${params.toString()}`);
      console.log("Transaction API response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Transaction response:", data);
        
        // Check if the response has the expected structure
        if (data.tx) {
          setSwapTransaction(data.tx);
          console.log("Swap transaction received:", data.tx);
        } else {
          console.error("Unexpected transaction response structure:", data);
          setError("Unexpected response structure from transaction API");
        }
      } else {
        const errorData = await response.json();
        console.error("Transaction API error:", errorData);
        setError(errorData.error || "Failed to get swap transaction");
      }
    } catch (error) {
      console.error("Error getting swap transaction:", error);
      setError(`Failed to get swap transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!swapTransaction || !walletClient || !publicClient || !address) {
      setError("Wallet not connected or transaction not available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Executing swap with transaction:", swapTransaction);
      
      // Prepare transaction data
      const transaction = {
        to: swapTransaction.to as `0x${string}`,
        data: swapTransaction.data as `0x${string}`,
        value: BigInt(swapTransaction.value || "0"),
        gas: BigInt(swapTransaction.gas || "0"),
        gasPrice: BigInt(swapTransaction.gasPrice || "0")
      };

      console.log("Prepared transaction:", transaction);

      // Send the transaction
      const hash = await walletClient.sendTransaction(transaction);
      
      console.log("Transaction sent with hash:", hash);
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log("Transaction confirmed:", receipt);
      
      setError(null);
      alert(`Swap transaction successful! Hash: ${hash}`);
      
      // Clear the quote and transaction after successful execution
      setQuote(null);
      setSwapTransaction(null);
      setAmount("");
      
    } catch (error) {
      console.error("Error executing swap:", error);
      setError(`Failed to execute swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTokenAmount = (amount: string, decimals: number): string => {
    try {
      if (decimals === 18) {
        return formatEther(BigInt(amount));
      } else {
        return formatUnits(BigInt(amount), decimals);
      }
    } catch {
      return amount;
    }
  };

  const checkAllowance = async () => {
    if (!fromTokenInfo || !address || !chainId) {
      return;
    }

    // Skip allowance check for native tokens
    if (fromTokenInfo.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
      setAllowance("999999999999999999999999999999");
      return;
    }

    try {
      const params = new URLSearchParams({
        tokenAddress: fromTokenInfo.address,
        walletAddress: address,
        chainId: chainId.toString()
      });

      const response = await fetch(`https://pebble-19ip.onrender.com/api/swap/allowance?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Allowance response:", data);
        setAllowance(data.allowance || "0");
      } else {
        console.error("Failed to check allowance");
        setAllowance("0");
      }
    } catch (error) {
      console.error("Error checking allowance:", error);
      setAllowance("0");
    }
  };

  const getApprovalTransaction = async () => {
    if (!fromTokenInfo || !amount || !chainId) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);
    setApprovalTransaction(null);

    try {
      // Convert amount to the proper format (wei/smallest unit)
      let formattedAmount: string;
      if (fromTokenInfo.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        // Native token (ETH, MATIC, etc.)
        formattedAmount = parseEther(amount).toString();
      } else {
        // ERC20 token
        formattedAmount = parseUnits(amount, fromTokenInfo.decimals).toString();
      }

      console.log("Approval parameters:", {
        tokenAddress: fromTokenInfo.address,
        amount: formattedAmount,
        chainId: chainId.toString()
      });

      const params = new URLSearchParams({
        tokenAddress: fromTokenInfo.address,
        amount: formattedAmount,
        chainId: chainId.toString()
      });

      const response = await fetch(`https://pebble-19ip.onrender.com/api/swap/approve?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Approval response:", data);
        
        if (data.to && data.data) {
          setApprovalTransaction(data);
          console.log("Approval transaction received:", data);
        } else {
          console.error("Unexpected approval response structure:", data);
          setError("Unexpected response structure from approval API");
        }
      } else {
        const errorData = await response.json();
        console.error("Approval API error:", errorData);
        setError(errorData.error || "Failed to get approval transaction");
      }
    } catch (error) {
      console.error("Error getting approval transaction:", error);
      setError(`Failed to get approval transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!approvalTransaction || !walletClient || !publicClient || !address) {
      setError("Wallet not connected or approval transaction not available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Executing approval with transaction:", approvalTransaction);
      
      // Prepare transaction data
      const transaction = {
        to: approvalTransaction.to as `0x${string}`,
        data: approvalTransaction.data as `0x${string}`,
        value: BigInt(approvalTransaction.value || "0"),
        gas: BigInt(approvalTransaction.gas || "0"),
        gasPrice: BigInt(approvalTransaction.gasPrice || "0")
      };

      console.log("Prepared approval transaction:", transaction);

      // Send the transaction
      const hash = await walletClient.sendTransaction(transaction);
      
      console.log("Approval transaction sent with hash:", hash);
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      console.log("Approval transaction confirmed:", receipt);
      
      setError(null);
      alert(`Approval transaction successful! Hash: ${hash}`);
      
      // Clear the approval transaction and check allowance again
      setApprovalTransaction(null);
      await checkAllowance();
      
    } catch (error) {
      console.error("Error executing approval:", error);
      setError(`Failed to execute approval: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="relative">
            <input
              type="text"
              value={fromToken}
              onChange={(e) => handleFromTokenSearch(e.target.value)}
              placeholder="Search token name, symbol, or address..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pl-10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
          {fromTokenInfo && (
            <div className="text-green-400 text-xs">
              ✓ {fromTokenInfo.name} ({fromTokenInfo.symbol})
            </div>
          )}
          {fromToken && !fromTokenInfo && !searchingToken && (
            <div className="text-red-400 text-xs">
              ❌ Token not found or not available for swapping
            </div>
          )}
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
          <div className="relative">
            <input
              type="text"
              value={toToken}
              onChange={(e) => handleToTokenSearch(e.target.value)}
              placeholder="Search token name, symbol, or address..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pl-10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
          {toTokenInfo && (
            <div className="text-green-400 text-xs">
              ✓ {toTokenInfo.name} ({toTokenInfo.symbol})
            </div>
          )}
          {toToken && !toTokenInfo && !searchingToken && (
            <div className="text-red-400 text-xs">
              ❌ Token not found or not available for swapping
            </div>
          )}
        </div>

        {/* Slippage */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">Slippage Tolerance (%)</label>
          <input
            type="number"
            value={slippage}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = parseInt(value);
              if (value === "" || (numValue >= 1 && numValue <= 50)) {
                setSlippage(value);
              }
            }}
            placeholder="1"
            min="1"
            max="50"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          />
          <p className="text-white/40 text-xs">Must be between 1 and 50</p>
        </div>

                 {/* Error Display */}
         {error && (
           <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
             <div className="flex items-center space-x-2">
               <AlertCircle className="w-4 h-4 text-red-400" />
               <span className="text-red-400 text-sm">{error}</span>
             </div>
           </div>
         )}

         {/* Allowance Display */}
         {fromTokenInfo && fromTokenInfo.address !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" && (
           <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
             <div className="flex items-center space-x-2 mb-2">
               <AlertCircle className="w-4 h-4 text-yellow-400" />
               <span className="text-yellow-400 text-sm font-medium">Token Allowance</span>
             </div>
             <div className="text-white/60 text-xs space-y-1">
               <div>Current Allowance: {formatTokenAmount(allowance, fromTokenInfo.decimals)} {fromTokenInfo.symbol}</div>
               <div>Required Amount: {amount} {fromTokenInfo.symbol}</div>
               {BigInt(allowance) < BigInt(parseUnits(amount || "0", fromTokenInfo.decimals)) && (
                 <div className="text-red-400">⚠️ Approval required before swapping</div>
               )}
             </div>
           </div>
         )}

         {/* Approval Transaction Display */}
         {approvalTransaction && (
           <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
             <div className="flex items-center space-x-2 mb-2">
               <CheckCircle className="w-4 h-4 text-orange-400" />
               <span className="text-orange-400 text-sm font-medium">Approval Ready</span>
             </div>
             <div className="text-white/60 text-xs space-y-1">
               <div>Gas: {approvalTransaction.gas}</div>
               <div>Gas Price: {approvalTransaction.gasPrice}</div>
               <div>Value: {approvalTransaction.value}</div>
               <div>To: {approvalTransaction.to}</div>
             </div>
           </div>
         )}

        {/* Quote Display */}
        {quote && toTokenInfo && !swapTransaction && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Quote Received</span>
            </div>
            <div className="text-white/60 text-xs space-y-1">
              <div>You will receive: {formatTokenAmount(quote.dstAmount, toTokenInfo.decimals)} {toTokenInfo.symbol}</div>
            </div>
          </div>
        )}

        {/* Swap Transaction Display */}
        {swapTransaction && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Ready to Execute Swap</span>
            </div>
            <div className="text-white/60 text-xs space-y-1">
              <div>Gas: {swapTransaction.gas}</div>
              <div>Gas Price: {swapTransaction.gasPrice}</div>
              <div>Value: {swapTransaction.value} wei</div>
              <div className="truncate">To: {swapTransaction.to}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={getSwapQuote}
            disabled={loading || !fromTokenInfo || !toTokenInfo || !amount || searchingToken}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Get Quote</span>
          </button>

          {/* Approval Button - Show if approval is needed */}
          {fromTokenInfo && fromTokenInfo.address !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" && 
           BigInt(allowance) < BigInt(parseUnits(amount || "0", fromTokenInfo.decimals)) && 
           !approvalTransaction && (
            <button
              onClick={getApprovalTransaction}
              disabled={loading || !fromTokenInfo || !amount}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {loading ? "Processing..." : "Get Approval"}
            </button>
          )}

          {/* Execute Approval Button */}
          {approvalTransaction && (
            <button
              onClick={handleApproval}
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {loading ? "Processing..." : "Execute Approval"}
            </button>
          )}

          {/* Get Transaction Button - Only show if approval is not needed or already approved */}
          {quote && !swapTransaction && 
           (fromTokenInfo?.address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" || 
            BigInt(allowance) >= BigInt(parseUnits(amount || "0", fromTokenInfo?.decimals || 18))) && (
            <button
              onClick={getSwapTransaction}
              disabled={loading}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Build Transaction</span>
            </button>
          )}

          {/* Execute Swap Button */}
          {swapTransaction && (
            <button
              onClick={handleSwap}
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Execute Swap</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapInterface; 