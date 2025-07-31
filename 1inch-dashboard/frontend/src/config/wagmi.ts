import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, arbitrum, optimism, base, sepolia } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: '1inch DeFi Dashboard',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [mainnet, polygon, arbitrum, optimism, base, sepolia],
  ssr: true,
}) 