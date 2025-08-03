import React, { useState, useEffect } from "react";
import { History, Search, AlertCircle, RefreshCw, ExternalLink, Hash, ArrowUpRight, ArrowDownLeft, Globe } from "lucide-react";
import { useAccount, useChainId } from "wagmi";

interface TransactionEvent {
  id: string;
  details: {
    txHash: string;
    type: string;
    timestamp?: number;
    blockNumber?: number;
    from?: string;
    to?: string;
    value?: string;
    tokenSymbol?: string;
  };
  [key: string]: any;
}

interface HistoryResponse {
  items: TransactionEvent[];
  total: number;
  [key: string]: any;
}

interface DomainInfo {
  result: Array<{
    protocol: string;
    address: string;
    checkUrl: string;
  }>;
}

const TransactionHistory: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [isDomainSearch, setIsDomainSearch] = useState<boolean>(false);

  // Check if domain search is supported for current chain
  const isDomainSearchSupported = () => {
    return chainId === 1; // Ethereum Mainnet only
  };

  // Check if input looks like a domain
  const isDomainInput = (input: string) => {
    return input.includes('.') && !input.startsWith('0x');
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

  const fetchHistory = async (targetAddress?: string) => {
    let addressToSearch = targetAddress || address;
    
    if (!addressToSearch) {
      setError("No wallet address available");
      return;
    }

    // Reset to page 1 when fetching new data
    setCurrentPage(1);
    
    if (!chainId || chainId <= 0) {
      setError("Invalid chain ID");
      return;
    }

    // Check if input is a domain and resolve it
    if (isDomainInput(addressToSearch) && isDomainSearchSupported()) {
      setIsDomainSearch(true);
      setLoading(true);
      setError(null);
      
      const resolvedAddress = await resolveDomain(addressToSearch);
      if (resolvedAddress) {
        addressToSearch = resolvedAddress;
        console.log(`Resolved domain to address: ${resolvedAddress}`);
      } else {
        setError(`Could not resolve domain: ${addressToSearch}`);
        setLoading(false);
        return;
      }
    } else {
      setIsDomainSearch(false);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching history for:", { addressToSearch, chainId, limit });
      const response = await fetch(`https://pebble-19ip.onrender.com/history/wallet?address=${addressToSearch}&chainId=${chainId}&limit=${limit}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch history:", errorText);
        throw new Error(`Failed to fetch history: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("History data:", data);
      console.log("Requested limit:", limit, "Actual items received:", data.items?.length || 0);
      
             // Ensure we have the correct data structure
       if (!data.items) {
         data.items = [];
       }
       
       // Set total to the requested limit (this is the total transactions we want to show)
       data.total = limit;
       
       // If API returns more items than requested limit, slice them
       if (data.items.length > limit) {
         data.items = data.items.slice(0, limit);
       }
      
      setHistoryData(data);
    } catch (error: any) {
      console.error("Error fetching history:", error);
      setError(error.message || "Failed to fetch transaction history");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchAddress.trim()) {
      fetchHistory(searchAddress.trim());
    }
  };

  const handleRefresh = () => {
    // If there's a search address, use it; otherwise use connected wallet
    if (searchAddress.trim()) {
      fetchHistory(searchAddress.trim());
    } else {
      fetchHistory();
    }
  };

  useEffect(() => {
    if (address && chainId && chainId > 0) {
      fetchHistory();
    }
  }, [address, chainId]); // Remove limit from dependencies to prevent infinite loops

  // Separate effect for limit changes
  useEffect(() => {
    if (address && chainId && chainId > 0 && historyData) {
      // If there's a search address, use it; otherwise use connected wallet
      if (searchAddress.trim()) {
        fetchHistory(searchAddress.trim());
      } else {
        fetchHistory();
      }
    }
  }, [limit]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getTransactionIcon = (type: string) => {
    if (type.toLowerCase().includes('swap') || type.toLowerCase().includes('exchange')) {
      return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    } else if (type.toLowerCase().includes('transfer') || type.toLowerCase().includes('send')) {
      return <ArrowDownLeft className="w-4 h-4 text-blue-400" />;
    }
    return <Hash className="w-4 h-4 text-gray-400" />;
  };

  const getTransactionTypeColor = (type: string) => {
    if (type.toLowerCase().includes('swap') || type.toLowerCase().includes('exchange')) {
      return "text-green-400";
    } else if (type.toLowerCase().includes('transfer') || type.toLowerCase().includes('send')) {
      return "text-blue-400";
    }
    return "text-gray-400";
  };

  const getBlockExplorerUrl = (txHash: string, chainId: number) => {
    switch (chainId) {
      case 1: // Ethereum Mainnet
        return `https://etherscan.io/tx/${txHash}`;
      case 137: // Polygon
        return `https://polygonscan.com/tx/${txHash}`;
      case 42161: // Arbitrum One
        return `https://arbiscan.io/tx/${txHash}`;
      case 8453: // Base
        return `https://basescan.org/tx/${txHash}`;
      case 43114: // Avalanche
        return `https://snowtrace.io/tx/${txHash}`;
      case 100: // Gnosis
        return `https://gnosisscan.io/tx/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`; // fallback
    }
  };

  // Pagination calculations - Always show 10 per page
  const itemsPerPage = 10;
  const totalPages = historyData ? Math.ceil((historyData.total || historyData.items?.length || 0) / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = historyData?.items?.slice(startIndex, endIndex) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the component
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Transaction History</h3>
        <div className="flex items-center space-x-2">
          <span className="text-white/60 text-sm">
            Chain ID: {chainId ? chainId : 'Not connected'}
          </span>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-3 py-1 rounded-lg text-xs transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <History className="w-4 h-4 text-white/60" />
          <span className="text-white/60 text-sm">
            Search by Address {isDomainSearchSupported() && "or Domain"}
          </span>
          {isDomainSearchSupported() && (
            <Globe className="w-4 h-4 text-blue-400" />
          )}
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder={
              isDomainSearchSupported() 
                ? "Enter wallet address or domain name (e.g., vitalik.eth)" 
                : "Enter wallet address (optional)"
            }
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchAddress.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
        
        {isDomainSearchSupported() && (
          <p className="text-white/40 text-xs mt-2">
            💡 Domain search works for Ethereum Mainnet only
          </p>
        )}
        
        <div className="flex items-center space-x-2 mt-3">
          <label className="text-white/60 text-sm">Limit:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value={5} className="bg-gray-800 text-white">5</option>
            <option value={10} className="bg-gray-800 text-white">10</option>
            <option value={20} className="bg-gray-800 text-white">20</option>
            <option value={50} className="bg-gray-800 text-white">50</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">
            {isDomainSearch ? "Resolving domain..." : "Loading transaction history..."}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Error loading data</p>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <button 
            onClick={() => {
              // If there's a search address, use it; otherwise use connected wallet
              if (searchAddress.trim()) {
                fetchHistory(searchAddress.trim());
              } else {
                fetchHistory();
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* History Data */}
      {historyData && !loading && !error && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">
              Recent Transactions ({historyData.total || historyData.items?.length || 0})
            </h4>
          </div>
          
          {currentTransactions && currentTransactions.length > 0 ? (
            <div className="space-y-3">
              {currentTransactions.map((tx) => (
                <div key={tx.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(tx.details.type)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${getTransactionTypeColor(tx.details.type)}`}>
                            {tx.details.type}
                          </span>
                          {tx.details.blockNumber && (
                            <span className="text-white/40 text-xs">
                              Block #{tx.details.blockNumber}
                            </span>
                          )}
                        </div>
                        {tx.details.timestamp && (
                          <p className="text-white/60 text-xs">
                            {formatTimestamp(tx.details.timestamp)}
                          </p>
                        )}
                        {tx.details.from && tx.details.to && (
                          <div className="text-white/60 text-xs mt-1">
                            <span>From: {formatAddress(tx.details.from)}</span>
                            <span className="mx-2">→</span>
                            <span>To: {formatAddress(tx.details.to)}</span>
                          </div>
                        )}
                        {tx.details.value && tx.details.tokenSymbol && (
                          <p className="text-white/60 text-xs">
                            {parseFloat(tx.details.value).toFixed(4)} {tx.details.tokenSymbol}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <a
                        href={getBlockExplorerUrl(tx.details.txHash, chainId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="w-8 h-8 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No transaction history found</p>
              <p className="text-white/40 text-sm">This wallet has no recent transactions</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && currentTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                              <div className="text-white/60 text-sm">
                  Showing {startIndex + 1}-{Math.min(endIndex, historyData?.items?.length || 0)} of {historyData?.total || historyData?.items?.length || 0} transactions
                </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                >
                  <span>←</span>
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white/60 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory; 