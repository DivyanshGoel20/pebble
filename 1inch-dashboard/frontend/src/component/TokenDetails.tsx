import React, { useState, useEffect } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { Search, Coins, AlertCircle, CheckCircle, Loader2, RefreshCw, ExternalLink, Info } from "lucide-react";

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  eip2612?: boolean;
  domainVersion?: string;
  isFoT?: boolean;
  displayedSymbol?: string;
  coingeckoId?: string;
  chainId?: number;
}

interface SearchResult {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  eip2612?: boolean;
  domainVersion?: string;
  isFoT?: boolean;
  displayedSymbol?: string;
  coingeckoId?: string;
  chainId?: number;
}

interface TokenDetailsData {
  details: {
    circulatingSupply: number;
    totalSupply: number;
    vol24: number;
    marketCap: number;
    provider: string;
    providerURL: string;
  };
  assets: {
    name: string;
    website: string;
    description: string;
    explorer: string;
    research: string;
    symbol: string;
    type: string;
    decimals: number;
    status: string;
    tags: string[];
    links: Array<{
      name: string;
      url: string;
    }>;
  };
}

const TokenDetails: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const chain = config.chains.find(c => c.id === chainId);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Native token info for current chain
  const getNativeTokenInfo = (): TokenInfo => {
    switch (chainId) {
      case 1: return {
        address: "0x0000000000000000000000000000000000000000",
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
      };
      case 137: return {
        address: "0x0000000000000000000000000000000000000000",
        name: "Polygon",
        symbol: "MATIC",
        decimals: 18,
        logoURI: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png"
      };
      case 42161: return {
        address: "0x0000000000000000000000000000000000000000",
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
      };
      case 8453: return {
        address: "0x0000000000000000000000000000000000000000",
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
      };
      case 43114: return {
        address: "0x0000000000000000000000000000000000000000",
        name: "Avalanche",
        symbol: "AVAX",
        decimals: 18,
        logoURI: "https://assets.coingecko.com/coins/images/12559/small/avalanche-avax.png"
      };
      case 100: return {
        address: "0x0000000000000000000000000000000000000000",
        name: "xDai",
        symbol: "XDAI",
        decimals: 18,
        logoURI: "https://assets.coingecko.com/coins/images/11062/small/xdai.png"
      };
      default: return {
        address: "0x0000000000000000000000000000000000000000",
        name: "Native Token",
        symbol: "NATIVE",
        decimals: 18,
        logoURI: ""
      };
    }
  };

  const nativeToken = getNativeTokenInfo();

  // Search tokens using Token API
  const searchTokens = async (query: string) => {
    if (!query.trim() || !chainId) return;

    setIsSearching(true);
    setError(null);

    try {
      console.log(`Searching tokens for query: ${query} on chain: ${chainId}`);
      const response = await fetch(`http://localhost:5000/api/token/search?query=${encodeURIComponent(query)}&chainId=${chainId}&limit=10`);
      
      console.log(`Search response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Search response:", data);
        
        if (data && data.tokens) {
          setSearchResults(data.tokens);
          console.log("Set search results:", data.tokens);
        } else {
          console.log("No tokens in response, setting empty array");
          setSearchResults([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("Search API error:", errorData);
        setError(`Search failed: ${errorData.error || `Status ${response.status}`}`);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching tokens:", error);
      setError(`Search error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };



  // Handle search input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchTokens(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, chainId]);

  // Clear search and fetch native token details when chain changes
  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedToken(null);
    setError(null);
    // Automatically fetch native token details for the current chain
    if (chainId) {
      getNativeTokenDetails();
    }
  }, [chainId]);

  // Separate state for native token details
  const [nativeTokenDetails, setNativeTokenDetails] = useState<TokenDetailsData | null>(null);

  // Get native token details using Token Details API
  const getNativeTokenDetails = async () => {
    if (!chainId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/token-details/native/${chainId}`);
      
      if (response.ok) {
        const data = await response.json();
        setNativeTokenDetails(data); // Store in separate state
      } else {
        setError("Failed to get native token details");
      }
    } catch (error) {
      console.error("Error getting native token details:", error);
      setError("Failed to get native token details");
    } finally {
      setLoading(false);
    }
  };

  // Get token details for a specific token
  const getTokenDetails = async (query: string) => {
    if (!query.trim() || !chainId) return;

    setLoading(true);
    setError(null);
    setSelectedToken(null); // Clear any previous token

    try {
      console.log(`Fetching token details for query: ${query} on chain: ${chainId}`);
      const response = await fetch(`http://localhost:5000/api/token-details/search?query=${encodeURIComponent(query)}&chainId=${chainId}`);
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Token details response:", data);
        
        // Validate the response structure - some tokens might only have details
        if (data && data.details) {
          // If assets is missing, create a minimal assets object
          if (!data.assets) {
            data.assets = {
              name: "Unknown Token",
              symbol: "UNKNOWN",
              type: "Token",
              decimals: 18,
              status: "Active",
              description: "Token details available",
              website: "",
              explorer: "",
              research: "",
              tags: [],
              links: []
            };
          }
          
          setSelectedToken(data);
          setSearchQuery(query);
          setSearchResults([]);
          console.log("Token details fetched and set:", data);
        } else {
          console.error("Invalid token details response structure:", data);
          setError("Invalid token details response");
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("Token details API error:", errorData);
        setError(errorData.error || `Failed to get token details (Status: ${response.status})`);
        console.error("API Error:", errorData);
      }
    } catch (error) {
      console.error("Error getting token details:", error);
      setError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelect = (token: SearchResult) => {
    // Fetch detailed token information
    getTokenDetails(token.address);
  };

  const handleNativeTokenClick = () => {
    setSearchQuery("");
    setSearchResults([]);
    // Fetch native token details from API
    getNativeTokenDetails();
  };

  if (!address) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Token Details</h3>
        <p className="text-white/60 text-center">Connect your wallet to view token details</p>
      </div>
    );
  }

  // Error boundary for rendering
  if (error && !selectedToken && !nativeTokenDetails) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Token Details</h3>
          <div className="flex items-center space-x-2">
            {chain && (
              <span className="text-white/60 text-sm">{chain.name}</span>
            )}
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Error Loading Token Details</span>
          </div>
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (chainId) {
                getNativeTokenDetails();
              }
            }}
            className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Token Details</h3>
        <div className="flex items-center space-x-2">
          {chain && (
            <span className="text-white/60 text-sm">{chain.name}</span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Token Search Section */}
        <div className="space-y-3">
          <h4 className="text-white/80 text-sm font-medium">Search Tokens</h4>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  getTokenDetails(searchQuery.trim());
                }
              }}
              // placeholder="Search for tokens by name, symbol, or address (e.g., 1inch, USDC, 0x111111111117dC0aa78b770fA6A738034120C302)"
              placeholder="Search for tokens by address (e.g., 0x111111111117dC0aa78b770fA6A738034120C302)"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 pr-10"
            />
            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  getTokenDetails(searchQuery.trim());
                }
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-blue-400 transition-colors"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-white/60" />
              ) : (
                <Search className="w-4 h-4 text-white/60" />
              )}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white/5 rounded-lg border border-white/10 max-h-60 overflow-y-auto">
              {searchResults.map((token, index) => (
                <div
                  key={`${token.address}-${index}`}
                  onClick={() => handleTokenSelect(token)}
                  className="p-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {token.logoURI && (
                      <img 
                        src={token.logoURI} 
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{token.name}</span>
                        <span className="text-white/60 text-sm">({token.symbol})</span>
                      </div>
                      <p className="text-white/40 text-xs font-mono">{token.address.slice(0, 6)}...{token.address.slice(-4)}</p>
                      <p className="text-white/40 text-xs">Decimals: {token.decimals}</p>
                    </div>
                    <div className="text-blue-400 text-xs">
                      Click to view details
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Searched Token Details */}
        {selectedToken && searchQuery && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-white/80 text-sm font-medium">Token Details</h4>
              <button
                onClick={() => {
                  setSelectedToken(null);
                  setSearchQuery("");
                }}
                className="text-red-400 hover:text-red-300 text-xs transition-colors"
              >
                Clear
              </button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                             {/* Token Header */}
               <div className="flex items-center space-x-3 mb-4">
                 <div>
                   <h5 className="text-white font-semibold text-lg">{selectedToken.assets.name || "Unknown Token"}</h5>
                   <p className="text-white/60">{selectedToken.assets.symbol || "UNKNOWN"}</p>
                 </div>
                 <div className="ml-auto flex items-center space-x-1 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                   <span>{selectedToken.assets.type || "Token"}</span>
                 </div>
               </div>

                             {/* Token Information Grid */}
               <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-white/60">Type:</span>
                     <span className="text-white">{selectedToken.assets.type || "Token"}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-white/60">Decimals:</span>
                     <span className="text-white">{selectedToken.assets.decimals || "18"}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-white/60">Status:</span>
                     <span className="text-white">{selectedToken.assets.status || "Active"}</span>
                   </div>
                 </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Chain:</span>
                    <span className="text-white">{chain?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Chain ID:</span>
                    <span className="text-white">{chainId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Search Query:</span>
                    <span className="text-white font-mono text-xs">{searchQuery}</span>
                  </div>
                </div>
              </div>

                             {/* Description */}
               <div className="mb-4 p-3 bg-white/5 rounded-lg">
                 <div className="flex items-center space-x-2 mb-2">
                   <Info className="w-4 h-4 text-white/60" />
                   <span className="text-white/80 text-sm font-medium">Description</span>
                 </div>
                 <p className="text-white/80 text-sm">
                   {selectedToken.assets.description || "Token details available from market data provider."}
                 </p>
               </div>

                             {/* Tags */}
               <div className="mb-4">
                 <span className="text-white/60 text-xs">Tags:</span>
                 <div className="flex flex-wrap gap-1 mt-1">
                   {selectedToken.assets.tags && selectedToken.assets.tags.length > 0 ? (
                     selectedToken.assets.tags.map((tag, index) => (
                       <span key={index} className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                         {tag}
                       </span>
                     ))
                   ) : (
                     <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs">
                       No tags available
                     </span>
                   )}
                 </div>
               </div>

              {/* Market Data */}
              {selectedToken.details && (
                <div className="space-y-3 p-3 bg-white/5 rounded-lg mb-4">
                  <h6 className="text-white font-medium text-sm flex items-center space-x-2">
                    <Coins className="w-4 h-4" />
                    <span>Market Data</span>
                  </h6>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/60">Market Cap:</span>
                      <span className="text-white">${selectedToken.details.marketCap.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">24h Volume:</span>
                      <span className="text-white">${selectedToken.details.vol24.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Circulating Supply:</span>
                      <span className="text-white">{selectedToken.details.circulatingSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Supply:</span>
                      <span className="text-white">{selectedToken.details.totalSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-white/60">Provider:</span>
                      <span className="text-white">{selectedToken.details.provider}</span>
                    </div>
                  </div>
                </div>
              )}

                             {/* External Links */}
               <div className="pt-4 border-t border-white/10">
                 <div className="flex flex-wrap gap-2">
                   {selectedToken.assets.website && (
                     <a
                       href={selectedToken.assets.website}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                     >
                       <span>Website</span>
                       <ExternalLink className="w-3 h-3" />
                     </a>
                   )}
                   {selectedToken.assets.explorer && (
                     <a
                       href={selectedToken.assets.explorer}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                     >
                       <span>Explorer</span>
                       <ExternalLink className="w-3 h-3" />
                     </a>
                   )}
                   {selectedToken.assets.research && (
                     <a
                       href={selectedToken.assets.research}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                     >
                       <span>Research</span>
                       <ExternalLink className="w-3 h-3" />
                     </a>
                   )}
                   {selectedToken.details?.providerURL && (
                     <a
                       href={selectedToken.details.providerURL}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                     >
                       <span>Market Data</span>
                       <ExternalLink className="w-3 h-3" />
                     </a>
                   )}
                   {selectedToken.assets.links && selectedToken.assets.links.map((link, index) => (
                     <a
                       key={index}
                       href={link.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors capitalize"
                     >
                       <span>{link.name}</span>
                       <ExternalLink className="w-3 h-3" />
                     </a>
                   ))}
                   {(!selectedToken.assets.website && !selectedToken.assets.explorer && !selectedToken.assets.research && !selectedToken.details?.providerURL && (!selectedToken.assets.links || selectedToken.assets.links.length === 0)) && (
                     <span className="text-gray-400 text-xs">No external links available</span>
                   )}
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* Native Token Details Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white/80 text-sm font-medium">Native Token Details</h4>
            <button
              onClick={handleNativeTokenClick}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            {/* Token Header */}
            <div className="flex items-center space-x-3 mb-4">
              {nativeToken.logoURI && (
                <img 
                  src={nativeToken.logoURI} 
                  alt={nativeToken.symbol}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                <h5 className="text-white font-semibold text-lg">{nativeToken.name}</h5>
                <p className="text-white/60">{nativeToken.symbol}</p>
              </div>
              <div className="ml-auto flex items-center space-x-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                <Coins className="w-3 h-3" />
                <span>Native</span>
              </div>
            </div>

            {/* Token Information Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Type:</span>
                  <span className="text-white">Coin</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Decimals:</span>
                  <span className="text-white">{nativeToken.decimals}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Status:</span>
                  <span className="text-white">Active</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Chain:</span>
                  <span className="text-white">{chain?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Chain ID:</span>
                  <span className="text-white">{chainId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Address:</span>
                  <span className="text-white font-mono text-xs">0x0000...0000</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-white/60" />
                <span className="text-white/80 text-sm font-medium">Description</span>
              </div>
              <p className="text-white/80 text-sm">
                {nativeTokenDetails?.assets?.description || 
                  `${nativeToken.name} is the native cryptocurrency of the ${chain?.name || 'blockchain'} network. It is used for transaction fees, staking, and governance.`}
              </p>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <span className="text-white/60 text-xs">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">native</span>
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">staking</span>
                <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">governance</span>
              </div>
            </div>

            {/* Market Data for Native Token */}
            {nativeTokenDetails?.details && (
              <div className="space-y-3 p-3 bg-white/5 rounded-lg mb-4">
                <h6 className="text-white font-medium text-sm flex items-center space-x-2">
                  <Coins className="w-4 h-4" />
                  <span>Market Data</span>
                </h6>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Market Cap:</span>
                    <span className="text-white">${nativeTokenDetails.details.marketCap.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">24h Volume:</span>
                    <span className="text-white">${nativeTokenDetails.details.vol24.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Circulating Supply:</span>
                    <span className="text-white">{nativeTokenDetails.details.circulatingSupply.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Total Supply:</span>
                    <span className="text-white">{nativeTokenDetails.details.totalSupply.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-white/60">Provider:</span>
                    <span className="text-white">{nativeTokenDetails.details.provider}</span>
                  </div>
                </div>
              </div>
            )}

            {/* External Links for Native Token */}
            {nativeTokenDetails?.assets && (
              <div className="pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-2">
                  {nativeTokenDetails.assets.website && (
                    <a
                      href={nativeTokenDetails.assets.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {nativeTokenDetails.assets.explorer && (
                    <a
                      href={nativeTokenDetails.assets.explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                    >
                      <span>Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {nativeTokenDetails.assets.research && (
                    <a
                      href={nativeTokenDetails.assets.research}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                    >
                      <span>Research</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {nativeTokenDetails.details?.providerURL && (
                    <a
                      href={nativeTokenDetails.details.providerURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                    >
                      <span>Market Data</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {nativeTokenDetails.assets.links && nativeTokenDetails.assets.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs transition-colors capitalize"
                    >
                      <span>{link.name}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-white/60" />
            <span className="text-white/60 ml-2">Loading token details...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetails; 