import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useNetwork, Network } from '../context/NetworkContext';

const NetworkSwitcher: React.FC = () => {
  const { selectedNetwork, setSelectedNetwork, networks } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);

  const handleNetworkSelect = (network: Network) => {
    setSelectedNetwork(network);
    setIsOpen(false);
  };

  return (
    <>
      {/* Network Selector Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
      >
        <span className="text-lg">{selectedNetwork.icon}</span>
        <span className="font-medium">{selectedNetwork.name}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Network Switcher Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Switch Networks</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Network List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => handleNetworkSelect(network)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedNetwork.id === network.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{network.icon}</span>
                    <span className="font-medium">{network.name}</span>
                  </div>
                  {selectedNetwork.id === network.id && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Connected</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkSwitcher; 