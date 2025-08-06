import React, { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';

const UpdateNotification: React.FC = () => {
  const { isUpdateAvailable, updatePWA } = usePWA();
  const [isVisible, setIsVisible] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isUpdateAvailable || !isVisible) {
    return null;
  }

  const handleUpdate = async () => {
    setIsUpdating(true);
    const success = await updatePWA();
    setIsUpdating(false);
    
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-900">
              Update Available
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              A new version of AI Platform is ready to install
            </p>
            
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Now'
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Later
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md text-blue-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;