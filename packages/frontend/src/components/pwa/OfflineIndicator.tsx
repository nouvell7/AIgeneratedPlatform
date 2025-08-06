import React from 'react';
import { usePWA } from '../../hooks/usePWA';

const OfflineIndicator: React.FC = () => {
  const { isOffline } = usePWA();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40">
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-800 text-center">
                You're currently offline. Some features may be limited.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                <span className="text-xs text-yellow-700 font-medium">Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;