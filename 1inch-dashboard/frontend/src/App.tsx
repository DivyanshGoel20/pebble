import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import { Wallet, TrendingUp, Coins, Activity, Image, ArrowLeftRight, BarChart3, History, Settings, Home } from 'lucide-react'
import { useState } from 'react'
import NFTList from './component/NFTList'
import GasPrice from './component/GasPrice'
import TokenBalances from './component/TokenBalances'
import TransactionTraces from './component/TransactionTraces'
import TransactionHistory from './component/TransactionHistory'
import SpotPrices from './component/SpotPrices'
import SwapInterface from './component/SwapInterface'
import PaymentInterface from './component/PaymentInterface'
import TokenDetails from './component/TokenDetails'

// Tab configuration
const tabs = [
  { id: 'overview', name: 'Overview', icon: Home },
  { id: 'swap', name: 'Swap & Trade', icon: ArrowLeftRight },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'history', name: 'Transaction History', icon: History },
  { id: 'nfts', name: 'NFTs & Assets', icon: Image },
]

function App() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address,
  })
  const [activeTab, setActiveTab] = useState('overview')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TokenBalances />
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Wallet Balance</h3>
                    <p className="text-white/60 text-sm">Your current holdings</p>
                  </div>
                </div>
                <div className="text-center py-6">
                  <div className="text-4xl font-bold text-white mb-2">
                    {balance ? `${parseFloat(balance.formatted).toFixed(4)}` : '0.0000'}
                  </div>
                  <div className="text-white/60 text-xl font-medium">
                    {balance ? balance.symbol : 'ETH'}
                  </div>
                </div>
              </div>
            </div>

            {/* Market Data */}
            <div className="grid grid-cols-1 gap-6">
              <SpotPrices />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onClick={() => setActiveTab('swap')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Start Trading</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
                  >
                    <History className="w-4 h-4" />
                    <span>View History</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'swap':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SwapInterface />
              <GasPrice />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <PaymentInterface />
            </div>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <TokenDetails />
            </div>
          </div>
        )

      case 'history':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TransactionHistory />
              <TransactionTraces />
            </div>
          </div>
        )

      case 'nfts':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <NFTList address={address} />
            </div>
          </div>
        )



      default:
        return null
    }
  }

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
              <h1 className="text-xl font-bold text-white">DeFi Dashboard</h1>
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
              Connect your wallet to view your personalized DeFi portfolio, token balances, and trading data.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          // Connected State - Dashboard with Tabs
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-2">
              <nav className="flex space-x-1" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                        ${activeTab === tab.id
                          ? 'bg-white/10 text-white shadow-lg'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {renderTabContent()}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
