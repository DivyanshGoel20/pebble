import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Network {
  id: number;
  name: string;
  symbol: string;
  icon: string;
}

export const networks: Network[] = [
  { id: 1, name: "Ethereum", symbol: "ETH", icon: "🔷" },
  { id: 42161, name: "Arbitrum", symbol: "ARB", icon: "🔵" },
  { id: 43114, name: "Avalanche", symbol: "AVAX", icon: "❄️" },
  { id: 100, name: "Gnosis", symbol: "XDAI", icon: "🟢" },
  { id: 137, name: "Polygon", symbol: "MATIC", icon: "🟣" },
  { id: 8453, name: "Base", symbol: "ETH", icon: "🔵" },
];

interface NetworkContextType {
  selectedNetwork: Network;
  setSelectedNetwork: (network: Network) => void;
  networks: Network[];
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[0]);

  return (
    <NetworkContext.Provider value={{ selectedNetwork, setSelectedNetwork, networks }}>
      {children}
    </NetworkContext.Provider>
  );
}; 