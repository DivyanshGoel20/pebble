import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import { Wallet, TrendingUp, Coins, Activity, Image } from 'lucide-react'
import NFTList from './component/NFTList'
import GasPrice from './component/GasPrice'
import TokenBalances from './component/TokenBalances'
import TransactionTraces from './component/TransactionTraces'
import TransactionHistory from './component/TransactionHistory'
import SpotPrices from './component/SpotPrices'
import SwapInterface from './component/SwapInterface'
import PaymentInterface from './component/PaymentInterface'

function App() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">1inch DeFi Dashboard</h1>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          // Not Connected State
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-white/60" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to Your DeFi Dashboard
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
              Connect your wallet to view your personalized DeFi portfolio, token balances, and 1inch-powered data.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          // Connected State - Dashboard
          <div className="space-y-8">
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Token Balances Component */}
              <TokenBalances />
            </div>

            {/* Gas Price and NFT Collection Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gas Price Component */}
              <GasPrice />
              
              {/* NFT Collection Section */}
              <NFTList address={address} />
            </div>

            {/* Swap Interface Row */}
            <div className="grid grid-cols-1 gap-6">
              <SwapInterface />
            </div>

            {/* Payment Interface Row */}
            <div className="grid grid-cols-1 gap-6">
              <PaymentInterface />
            </div>

            {/* Transaction Traces and History Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TransactionTraces />
              <TransactionHistory />
            </div>

            {/* Spot Prices Row */}
            <div className="grid grid-cols-1 gap-6">
              <SpotPrices />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
