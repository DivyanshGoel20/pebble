import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, arbitrum, base } from 'wagmi/chains'
import { defineChain } from 'viem'

// Define custom chains that aren't in wagmi by default
const avalanche = defineChain({
  id: 43114,
  name: 'Avalanche',
  network: 'avalanche',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    public: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
  },
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
})

const gnosis = defineChain({
  id: 100,
  name: 'Gnosis',
  network: 'gnosis',
  nativeCurrency: {
    decimals: 18,
    name: 'xDAI',
    symbol: 'XDAI',
  },
  rpcUrls: {
    default: { http: ['https://rpc.gnosischain.com'] },
    public: { http: ['https://rpc.gnosischain.com'] },
  },
  blockExplorers: {
    default: { name: 'GnosisScan', url: 'https://gnosisscan.io' },
  },
})

export const config = getDefaultConfig({
  appName: '1inch DeFi Dashboard',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [mainnet, arbitrum, avalanche, gnosis, polygon, base],
  ssr: true,
}) 