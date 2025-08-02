// Price utility functions for converting wei to USD

let cachedPrices: {[chainId: number]: {price: number, timestamp: number}} = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get native token info for each chain
const getNativeTokenInfo = (chainId: number) => {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return { id: 'ethereum', symbol: 'ETH' };
    case 137: // Polygon
      return { id: 'matic-network', symbol: 'MATIC' };
    case 42161: // Arbitrum
      return { id: 'ethereum', symbol: 'ETH' }; // Arbitrum uses ETH
    case 43114: // Avalanche
      return { id: 'avalanche-2', symbol: 'AVAX' };
    case 100: // Gnosis (formerly xDai)
      return { id: 'xdai', symbol: 'XDAI' };
    case 8453: // Base
      return { id: 'ethereum', symbol: 'ETH' }; // Base uses ETH
    default:
      return { id: 'ethereum', symbol: 'ETH' }; // Default to ETH
  }
};

// Get USDC address for each chain
const getUsdcAddress = (chainId: number) => {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    case 137: // Polygon
      return '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';
    case 42161: // Arbitrum
      return '0xaf88d065e77c8cc2239327c5edb3a432268e5831';
    case 43114: // Avalanche
      return '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e';
    case 100: // Gnosis
      return '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83';
    case 8453: // Base
      return '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
    default:
      return '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // Default to Ethereum USDC
  }
};

export const fetchNativeTokenPrice = async (chainId: number): Promise<number> => {
  const now = Date.now();
  const cached = cachedPrices[chainId];
  
  // Return cached price if it's still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.price;
  }
  
  try {
    const usdcAddress = getUsdcAddress(chainId);
    console.log(`Fetching USDC price for chain ${chainId} using address: ${usdcAddress}`);
    
    // Fetch USDC price from 1inch API
    const response = await fetch(`http://localhost:5000/spot-prices/addresses?chainId=${chainId}&addresses=${usdcAddress}`);
    
    if (response.ok) {
      const data = await response.json();
      const usdcPriceInWei = data[usdcAddress];
      
      if (usdcPriceInWei) {
        console.log(`USDC price in wei: ${usdcPriceInWei}`);
        
        // Convert wei to native token (USDC price in native token)
        const usdcPriceInNative = parseFloat(usdcPriceInWei) / Math.pow(10, 18);
        console.log(`USDC price in native token: ${usdcPriceInNative}`);
        
        // Since USDC = $1, the native token price in USD is 1 / usdcPriceInNative
        const nativeTokenUsdPrice = 1 / usdcPriceInNative;
        console.log(`Native token USD price: $${nativeTokenUsdPrice}`);
        
        cachedPrices[chainId] = { price: nativeTokenUsdPrice, timestamp: now };
        return nativeTokenUsdPrice;
      }
    }
    
    // Fallback to a reasonable default if API fails
    console.warn(`Failed to fetch USDC price for chain ${chainId}, using fallback value`);
    return 2000; // Fallback price
  } catch (error) {
    console.error(`Error fetching USDC price for chain ${chainId}:`, error);
    return 2000; // Fallback price
  }
};

export const weiToUSD = async (weiAmount: string, chainId: number): Promise<string> => {
  const wei = parseFloat(weiAmount);
  if (isNaN(wei)) return '$0.00';
  
  console.log(`Converting wei amount: ${weiAmount} (${wei}) for chain: ${chainId}`);
  
  // Step 1: Convert wei to native token (e.g., ETH, MATIC, BNB)
  const tokenPriceInNative = wei / Math.pow(10, 18);
  const nativeToken = getNativeTokenInfo(chainId);
  console.log(`Token price in ${nativeToken.symbol}: ${tokenPriceInNative}`);
  
  // Step 2: Fetch native token/USD price using USDC reference
  const nativeTokenUsdPrice = await fetchNativeTokenPrice(chainId);
  console.log(`${nativeToken.symbol}/USD price: $${nativeTokenUsdPrice}`);
  
  // Step 3: Calculate USD value
  const usdAmount = tokenPriceInNative * nativeTokenUsdPrice;
  console.log(`Final USD amount: $${usdAmount}`);
  
  if (usdAmount < 0.01) {
    return `$${usdAmount.toFixed(6)}`;
  } else if (usdAmount < 1) {
    return `$${usdAmount.toFixed(4)}`;
  } else if (usdAmount < 1000) {
    return `$${usdAmount.toFixed(2)}`;
  } else {
    return `$${usdAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
};

export const weiToUSDNumber = async (weiAmount: string, chainId: number): Promise<number> => {
  const wei = parseFloat(weiAmount);
  if (isNaN(wei)) return 0;
  
  // Step 1: Convert wei to native token (e.g., ETH, MATIC, BNB)
  const tokenPriceInNative = wei / Math.pow(10, 18);
  
  // Step 2: Fetch native token/USD price using USDC reference
  const nativeTokenUsdPrice = await fetchNativeTokenPrice(chainId);
  
  // Step 3: Calculate USD value
  return tokenPriceInNative * nativeTokenUsdPrice;
}; 