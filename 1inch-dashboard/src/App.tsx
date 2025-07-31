import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import { Wallet, TrendingUp, Coins, Activity } from 'lucide-react'

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
            {/* Welcome Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome back! 👋
                  </h2>
                  <p className="text-white/60">
                    Address: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm">Total Balance</p>
                  <p className="text-2xl font-bold text-white">
                    {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Token Balances Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Coins className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Token Balances</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  View all your token holdings across different chains
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Loading tokens...</span>
                    <span className="text-white">-</span>
                  </div>
                </div>
              </div>

              {/* DeFi Positions Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">DeFi Positions</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Your active liquidity positions and yield farming
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Loading positions...</span>
                    <span className="text-white">-</span>
                  </div>
                </div>
              </div>

              {/* 1inch Data Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">1inch Analytics</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Trading history and swap analytics from 1inch
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Loading analytics...</span>
                    <span className="text-white">-</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No recent activity to display</p>
                <p className="text-white/40 text-sm">Your transaction history will appear here</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
