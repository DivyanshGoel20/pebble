import React, { useState, useEffect } from "react";
import { Search, AlertCircle, Hash, Activity } from "lucide-react";
import { useChainId } from "wagmi";

interface TransactionTrace {
  [key: string]: any;
}

const TransactionTraces: React.FC = () => {
  const chainId = useChainId();
  
  const [blockNumber, setBlockNumber] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [traceData, setTraceData] = useState<TransactionTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'block' | 'transaction'>('block');



  const fetchBlockTrace = async () => {
    if (!blockNumber || !blockNumber.trim()) {
      setError("Please enter a block number");
      return;
    }
    
    if (!chainId || chainId <= 0) {
      setError("Invalid chain ID");
      return;
    }
    
    setLoading(true);
    setError(null);
    setTraceData(null); // Clear previous data
    
    try {
      console.log("Fetching block trace for:", { chainId, blockNumber });
      const response = await fetch(`https://pebble-19ip.onrender.com/traces/block-trace?chainId=${chainId}&blockNumber=${blockNumber.trim()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch block trace:", errorText);
        throw new Error(`Failed to fetch block trace: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Block trace data:", data);
      setTraceData(data);
    } catch (error: any) {
      console.error("Error fetching block trace:", error);
      setError(error.message || "Failed to fetch block trace");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionTrace = async () => {
    if (!blockNumber || !blockNumber.trim()) {
      setError("Please enter a block number");
      return;
    }
    
    if (!txHash || !txHash.trim()) {
      setError("Please enter a transaction hash");
      return;
    }
    
    if (!chainId || chainId <= 0) {
      setError("Invalid chain ID");
      return;
    }
    
    setLoading(true);
    setError(null);
    setTraceData(null); // Clear previous data
    
    try {
      console.log("Fetching transaction trace for:", { chainId, blockNumber, txHash });
      const response = await fetch(`https://pebble-19ip.onrender.com/traces/transaction-trace?chainId=${chainId}&blockNumber=${blockNumber.trim()}&txHash=${txHash.trim()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch transaction trace:", errorText);
        throw new Error(`Failed to fetch transaction trace: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Transaction trace data:", data);
      setTraceData(data);
    } catch (error: any) {
      console.error("Error fetching transaction trace:", error);
      setError(error.message || "Failed to fetch transaction trace");
    } finally {
      setLoading(false);
    }
  };

  // Component initialization - no automatic API calls needed
  useEffect(() => {
    console.log("TransactionTraces initialized with chainId:", chainId);
  }, [chainId]);

  const handleTabChange = (tab: 'block' | 'transaction') => {
    setActiveTab(tab);
    setError(null); // Clear errors when switching tabs
    setTraceData(null); // Clear trace data when switching tabs
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Transaction Traces</h3>
        <div className="flex items-center space-x-2">
          <span className="text-white/60 text-sm">
            Chain ID: {chainId ? chainId : 'Not connected'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => handleTabChange('block')}
          className={`px-3 py-1 rounded-lg text-xs transition-colors ${
            activeTab === 'block'
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-white/60 hover:bg-white/20"
          }`}
        >
          Block Trace
        </button>
        <button
          onClick={() => handleTabChange('transaction')}
          className={`px-3 py-1 rounded-lg text-xs transition-colors ${
            activeTab === 'transaction'
              ? "bg-blue-500 text-white"
              : "bg-white/10 text-white/60 hover:bg-white/20"
          }`}
        >
          Transaction Trace
        </button>
      </div>


      {/* Block Trace Tab */}
      {activeTab === 'block' && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Hash className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm">Block Trace</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter block number"
                value={blockNumber}
                onChange={(e) => setBlockNumber(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={fetchBlockTrace}
                disabled={loading || !chainId || chainId <= 0}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/60">Loading block trace...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {traceData && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-3">Block Trace Data</h4>
                <pre className="text-xs text-white/80 overflow-auto max-h-64 bg-black/20 p-3 rounded">
                  {JSON.stringify(traceData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Trace Tab */}
      {activeTab === 'transaction' && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm">Transaction Trace</span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter block number"
                value={blockNumber}
                onChange={(e) => setBlockNumber(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Enter transaction hash"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={fetchTransactionTrace}
                disabled={loading || !chainId || chainId <= 0}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Search Transaction</span>
              </button>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/60">Loading transaction trace...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {traceData && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-3">Transaction Trace Data</h4>
                <pre className="text-xs text-white/80 overflow-auto max-h-64 bg-black/20 p-3 rounded">
                  {JSON.stringify(traceData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTraces;