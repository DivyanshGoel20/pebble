import React, { useState, useEffect } from "react";
import { useAccount, useChainId, useConfig, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Send, User, Coins, AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { parseEther, parseUnits } from "viem";

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

interface DomainInfo {
  result: Array<{
    protocol: string;
    address: string;
    checkUrl: string;
  }>;
}

const PaymentInterface: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const chain = config.chains.find(c => c.id === chainId);

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isResolvingDomain, setIsResolvingDomain] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);
  const [userTokenBalances, setUserTokenBalances] = useState<{[tokenAddress: string]: any}>({});
  const [userTokenPrices, setUserTokenPrices] = useState<{[key: string]: number}>({});
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Wagmi hooks for transaction
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Clear all messages and form state when chain changes
  useEffect(() => {
    setRecipient("");
    setAmount("");
    setSelectedToken("");
    setResolvedAddress(null);
    setError(null);
    setSuccess(null);
    setIsResolvingDomain(false);
    setTransactionHash(null);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  }, [chainId]);

  // Cleanup timer when component unmounts or chainId changes
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Fetch user's token balances
  useEffect(() => {
    if (address && chainId) {
      fetchUserTokenBalances();
    }
  }, [address, chainId]);

  // Handle transaction state changes
  useEffect(() => {
    if (hash) {
      setTransactionHash(hash);
      setLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    if (isConfirmed && transactionHash) {
      setSuccess(`Payment of ${amount} ${getTokenSymbol(selectedToken)} sent successfully! Transaction: ${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`);
      // Clear form after successful transaction
      setRecipient("");
      setAmount("");
      setSelectedToken("");
      setResolvedAddress(null);
      setTransactionHash(null);
    }
  }, [isConfirmed, transactionHash, amount, selectedToken]);

  useEffect(() => {
    if (writeError) {
      setError(`Transaction failed: ${writeError.message}`);
      setLoading(false);
    }
  }, [writeError]);

  const fetchUserTokenBalances = async () => {
    if (!address || !chainId) return;
    
    try {
      const response = await fetch(`https://pebble-19ip.onrender.com/token-balances?walletAddress=${address}&chainId=${chainId}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserTokenBalances(data);
        
        // Fetch prices for tokens
        if (data && Object.keys(data).length > 0) {
          await fetchUserTokenPrices(Object.keys(data));
        }
      } else {
        console.error("Failed to fetch user token balances");
        setUserTokenBalances({});
      }
    } catch (error) {
      console.error("Error fetching user token balances:", error);
      setUserTokenBalances({});
    }
  };

  const fetchUserTokenPrices = async (tokenAddresses: string[]) => {
    if (!chainId || chainId <= 0 || tokenAddresses.length === 0) {
      return;
    }
    
    try {
      const response = await fetch(`https://pebble-19ip.onrender.com/spot-prices/addresses?chainId=${chainId}&addresses=${encodeURIComponent(tokenAddresses.join(','))}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserTokenPrices(data);
      } else {
        setUserTokenPrices({});
      }
    } catch (error) {
      console.error("Error fetching user token prices:", error);
      setUserTokenPrices({});
    }
  };

  // Get tokens that user actually has
  const getUserTokens = (): Token[] => {
    const tokens: Token[] = [];
    
    // Add native token (ETH, MATIC, etc.) if user has balance
    const nativeTokenAddress = "0x0000000000000000000000000000000000000000";
    if (userTokenBalances[nativeTokenAddress]) {
      const nativeToken = getNativeTokenInfo(chainId);
      if (nativeToken) {
        tokens.push({
          address: nativeTokenAddress,
          symbol: nativeToken.symbol,
          decimals: 18,
          name: nativeToken.name
        });
      }
    }
    
    // Add other tokens that user has
    Object.entries(userTokenBalances).forEach(([address, tokenData]) => {
      if (address !== nativeTokenAddress) {
        tokens.push({
          address: address,
          symbol: tokenData.symbol,
          decimals: tokenData.decimals,
          name: tokenData.name
        });
      }
    });
    
    return tokens;
  };

  const getNativeTokenInfo = (chainId: number) => {
    switch (chainId) {
      case 1: return { symbol: "ETH", name: "Ethereum" };
      case 137: return { symbol: "MATIC", name: "Polygon" };
      case 42161: return { symbol: "ETH", name: "Ethereum" };
      case 8453: return { symbol: "ETH", name: "Ethereum" };
      case 43114: return { symbol: "AVAX", name: "Avalanche" };
      case 100: return { symbol: "XDAI", name: "xDai" };
      default: return null;
    }
  };

  const userTokens = getUserTokens();

  // Check if ENS domain search is supported for current chain
  const isDomainSearchSupported = () => {
    return chainId === 1; // Ethereum Mainnet only
  };

  // Check if input looks like a domain
  const isDomainInput = (input: string) => {
    // Only consider it a domain if it has a dot, doesn't start with 0x, and looks like a complete domain
    return input.includes('.') && !input.startsWith('0x') && input.length > 5 && input.endsWith('.eth');
  };

  // Resolve domain to address
  const resolveDomain = async (domain: string): Promise<string | null> => {
    try {
      console.log(`Resolving domain: ${domain}`);
      const response = await fetch(`https://pebble-19ip.onrender.com/api/${domain}/info`);
      
      console.log(`Domain resolution response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to resolve domain: ${response.status}`);
        console.error(`Error response: ${errorText}`);
        return null;
      }
      
      const data: DomainInfo = await response.json();
      console.log(`Domain resolution result:`, data);
      console.log(`Result array length:`, data.result?.length);
      
      if (data.result && data.result.length > 0) {
        console.log(`First result item:`, data.result[0]);
        if (data.result[0].address) {
          console.log(`Successfully resolved domain to address: ${data.result[0].address}`);
          return data.result[0].address;
        } else {
          console.log(`No address found in first result item`);
        }
      } else {
        console.log(`No results found in domain resolution`);
      }
      
      console.log(`No address found in domain resolution result`);
      return null;
    } catch (error) {
      console.error("Error resolving domain:", error);
      return null;
    }
  };

  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    setResolvedAddress(null);
    setError(null);

    // Clear any existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // If it's a complete domain and domain search is supported, resolve it with debounce
    if (isDomainInput(value) && isDomainSearchSupported()) {
      const timer = setTimeout(async () => {
        setIsResolvingDomain(true);
        const resolved = await resolveDomain(value);
        setIsResolvingDomain(false);
        
        if (resolved) {
          setResolvedAddress(resolved);
        } else {
          setError(`Could not resolve domain: ${value}. Please check the domain name and try again.`);
        }
      }, 500); // 500ms debounce
      
      setDebounceTimer(timer);
    } else if (value.startsWith('0x') && value.length === 42) {
      // Valid Ethereum address
      setResolvedAddress(value);
    }
    // Remove all other error conditions to allow smooth typing
  };

  const handleSendPayment = async () => {
    if (!address || !recipient || !amount || !selectedToken) {
      setError("Please fill in all required fields");
      return;
    }

    if (!resolvedAddress) {
      setError("Please enter a valid recipient address or ENS domain");
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (!validateAmount(amount, selectedToken)) {
      setError("Amount exceeds your balance");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = userTokens.find(t => t.address === selectedToken);
      if (!token) {
        setError("Invalid token selected");
        setLoading(false);
        return;
      }

      // Convert amount to proper units based on token decimals
      const amountInWei = selectedToken === "0x0000000000000000000000000000000000000000" 
        ? parseEther(amount)
        : parseUnits(amount, token.decimals);

      if (selectedToken === "0x0000000000000000000000000000000000000000") {
        // Send native token (ETH, MATIC, etc.)
        writeContract({
          address: resolvedAddress as `0x${string}`,
          abi: [],
          functionName: '',
          value: amountInWei,
        });
      } else {
        // Send ERC-20 token
        const erc20Abi = [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ];

        writeContract({
          address: selectedToken as `0x${string}`,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [resolvedAddress as `0x${string}`, amountInWei],
        });
      }
    } catch (error) {
      console.error("Error sending payment:", error);
      setError("Failed to send payment");
      setLoading(false);
    }
  };

  const getTokenSymbol = (tokenAddress: string): string => {
    const token = userTokens.find(t => t.address === tokenAddress);
    return token ? token.symbol : "Unknown";
  };

  const getTokenName = (tokenAddress: string): string => {
    const token = userTokens.find(t => t.address === tokenAddress);
    return token ? token.name : "Unknown Token";
  };

  const getUserBalance = (tokenAddress: string): string => {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      // Native token balance
      return userTokenBalances[tokenAddress]?.balance || "0";
    }
    return userTokenBalances[tokenAddress]?.balance || "0";
  };

  const formatBalance = (balance: string, decimals: number): string => {
    if (!balance || balance === "0") return "0";
    const balanceNumber = parseFloat(balance) / Math.pow(10, decimals);
    return balanceNumber.toFixed(6);
  };

  const validateAmount = (inputAmount: string, tokenAddress: string): boolean => {
    if (!tokenAddress || !inputAmount) return false;
    
    const userBalance = getUserBalance(tokenAddress);
    const token = userTokens.find(t => t.address === tokenAddress);
    
    if (!token || !userBalance) return false;
    
    const inputValue = parseFloat(inputAmount);
    const balanceValue = parseFloat(formatBalance(userBalance, token.decimals));
    
    return inputValue > 0 && inputValue <= balanceValue;
  };

  if (!address) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Send Payment</h3>
        <p className="text-white/60 text-center">Connect your wallet to send payments</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Send Payment</h3>
        <div className="flex items-center space-x-2">
          {chain && (
            <span className="text-white/60 text-sm">{chain.name}</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Recipient Address */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">Recipient</label>
          <div className="relative">
            <input
              type="text"
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              placeholder={
                isDomainSearchSupported() 
                  ? "Enter wallet address or ENS domain (e.g., vitalik.eth)" 
                  : "Enter wallet address"
              }
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isResolvingDomain ? (
                <Loader2 className="w-4 h-4 animate-spin text-white/60" />
              ) : recipient.includes('.') && !recipient.startsWith('0x') ? (
                <User className="w-4 h-4 text-blue-400" />
              ) : (
                <User className="w-4 h-4 text-white/60" />
              )}
            </div>
          </div>
          {isDomainSearchSupported() && (
            <p className="text-white/40 text-xs">
              💡 ENS domain search works for Ethereum Mainnet only
            </p>
          )}
        </div>

        {/* Resolved Address Display */}
        {resolvedAddress && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Resolved Address:</span>
            </div>
            <p className="text-white/60 text-xs mt-1 font-mono">
              {resolvedAddress}
            </p>
          </div>
        )}

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
          {selectedToken && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60">
                Balance: {formatBalance(getUserBalance(selectedToken), userTokens.find(t => t.address === selectedToken)?.decimals || 18)} {getTokenSymbol(selectedToken)}
              </span>
              {amount && selectedToken && !validateAmount(amount, selectedToken) && (
                <span className="text-red-400">
                  Amount exceeds balance
                </span>
              )}
            </div>
          )}
        </div>

        {/* Token Selection */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">Token</label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="" className="bg-gray-800 text-white">Select token</option>
            {userTokens.map((token) => (
              <option key={token.address} value={token.address} className="bg-gray-800 text-white">
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Summary */}
        {amount && selectedToken && resolvedAddress && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium text-sm mb-3">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">From:</span>
                <span className="text-white font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">To:</span>
                <span className="text-white font-mono">{resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Amount:</span>
                <span className="text-white">{amount} {getTokenSymbol(selectedToken)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Network:</span>
                <span className="text-white">{chain?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Type:</span>
                <span className="text-white">
                  {selectedToken === "0x0000000000000000000000000000000000000000" ? "Native Transfer" : "Token Transfer"}
                </span>
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

        {/* Success Display */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {transactionHash && !isConfirmed && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Transaction Pending</span>
            </div>
            <p className="text-white/60 text-xs mt-1 font-mono">
              Hash: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
            </p>
            <p className="text-white/40 text-xs mt-1">
              Please wait for confirmation on the blockchain...
            </p>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendPayment}
          disabled={loading || isPending || isConfirming || !recipient || !amount || !selectedToken || !resolvedAddress || (!!selectedToken && !!amount && !validateAmount(amount, selectedToken))}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
        >
          {loading || isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isConfirming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>
            {loading || isPending ? "Preparing Transaction..." : 
             isConfirming ? "Confirming Transaction..." : 
             "Send Payment"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default PaymentInterface; 