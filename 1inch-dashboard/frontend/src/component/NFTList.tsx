import React, { useState, useEffect, useCallback } from "react";
import { fetchNFTs } from "./api";
import { useChainId, useConfig } from "wagmi";

interface NFT {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  contract_address?: string;
  token_id?: string;
  collection?: {
    name: string;
  };
  // v2 API specific fields
  asset_contract?: {
    address: string;
    schema_name: string;
  };
  provider?: string;
  chainId?: number;
  priority?: number;
}

interface NFTListProps {
  address?: string;
}

const NFTList: React.FC<NFTListProps> = ({ address }) => {
  const chainId = useChainId();
  const config = useConfig();
  const chain = config.chains.find(c => c.id === chainId);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current network supports NFTs
  const isNFTSupported = chainId === 1 || chainId === 100; // Ethereum or Gnosis

  useEffect(() => {
    if (!address || !isNFTSupported) {
      setNfts([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchNFTs(address, chainId);
        console.log("API Response:", response);
        
        // Handle v2 API response structure
        if (response.assets && Array.isArray(response.assets)) {
          setNfts(response.assets);
        } else if (response.data && response.data.assets) {
          setNfts(response.data.assets);
        } else if (Array.isArray(response)) {
          setNfts(response);
        } else {
          console.log("Unexpected data structure:", response);
          setNfts([]);
        }
      } catch (error) {
        console.error("Error fetching NFTs:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch NFTs");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, chainId, isNFTSupported]);

  if (!address) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">NFT Collection</h3>
        <p className="text-white/60 text-center">Connect your wallet to view your NFTs</p>
      </div>
    );
  }

  if (!isNFTSupported) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">NFT Collection</h3>
        <div className="text-center py-8">
          <p className="text-white/60">NFTs not supported on {chain?.name || 'this network'}</p>
          <p className="text-white/40 text-sm">Switch to Ethereum or Gnosis to view NFTs</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">NFT Collection</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading your NFTs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">NFT Collection</h3>
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">Error loading NFTs</p>
          <p className="text-white/60 text-sm">{error}</p>
          <p className="text-white/40 text-xs mt-2">Make sure your backend server is running and API key is configured</p>
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">NFT Collection</h3>
        <div className="text-center py-8">
          <p className="text-white/60">No NFTs found in this wallet</p>
          <p className="text-white/40 text-sm">Try connecting a different wallet or check your NFT holdings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">NFT Collection ({nfts.length})</h3>
        {chain && (
          <span className="text-white/60 text-sm">{chain.name}</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {nfts.map((nft) => {
          // Handle different field names from v2 API
          const nftName = nft.name || `NFT #${nft.token_id || nft.id}`;
          const nftImage = nft.image_url;
          const contractAddress = nft.contract_address || nft.asset_contract?.address;
          const tokenId = nft.token_id || nft.id?.split(':')?.[2] || nft.id;
          
          return (
            <div 
              key={nft.id} 
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-800">
                {nftImage ? (
                  <img 
                    src={nftImage} 
                    alt={nftName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTE2LjU2OSA3MCAxMzAgODMuNDMxIDMwIDEwMEMxMzAgMTE2LjU2OSAxMTYuNTY5IDEzMCAxMDAgMTMwQzgzLjQzMSAxMzAgNzAgMTE2LjU2OSA3MCAxMEM3MCA4My40MzEgODMuNDMxIDcwIDEwMCA3MFoiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <span className="text-white/40 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <h4 className="text-white font-medium text-sm mb-1 truncate">
                {nftName}
              </h4>
              {nft.collection?.name && (
                <p className="text-white/60 text-xs mb-2 truncate">
                  {nft.collection.name}
                </p>
              )}
              {nft.provider && (
                <p className="text-white/40 text-xs mb-1">
                  Provider: {nft.provider}
                </p>
              )}
              {nft.description && (
                <p className="text-white/40 text-xs line-clamp-2">
                  {nft.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NFTList;