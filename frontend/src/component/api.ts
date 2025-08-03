// API functions for fetching NFT data from our backend
const API_BASE_URL = 'https://pebble-19ip.onrender.com';

// Add timeout and retry logic
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const fetchNFTs = async (address: string, chainId?: number) => {
  try {
    console.log(`Making API request for address: ${address}, chainId: ${chainId}`);
    
    const url = chainId 
      ? `${API_BASE_URL}/fetchNfts?address=${address}&chainIds=${chainId}`
      : `${API_BASE_URL}/fetchNfts?address=${address}`;
    
    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      15000 // 15 second timeout
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`API request successful for ${address}`);
    return data;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Make sure the backend is running.');
      }
      throw error;
    }
    
    throw new Error('Failed to fetch NFTs');
  }
};

export const fetchNFTsWithParams = async (
  address: string, 
  limit: number = 50, 
  offset: number = 0, 
  chainIds: number = 1
) => {
  try {
    console.log(`Making API request with params: ${address}, limit: ${limit}, offset: ${offset}`);
    
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/fetchNfts?address=${address}&limit=${limit}&offset=${offset}&chainIds=${chainIds}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      15000 // 15 second timeout
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`API request with params successful for ${address}`);
    return data;
  } catch (error) {
    console.error('Error fetching NFTs with params:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Make sure the backend is running.');
      }
      throw error;
    }
    
    throw new Error('Failed to fetch NFTs');
  }
}; 