import React, { useState, useEffect } from 'react';
import { 
  getDevelopmentEnvironmentStatus,
  startDevelopmentEnvironment,
  stopDevelopmentEnvironment,
  createDevelopmentEnvironment,
} from '../../services/api/codespaces';

interface CodespaceStatusProps {
  projectId: string;
  onEnvironmentCreated?: () => void;
}

const CodespaceStatus: React.FC<CodespaceStatusProps> = ({
  projectId,
  onEnvironmentCreated,
}) => {
  const [status, setStatus] = useState<'none' | 'creating' | 'available' | 'unavailable'>('none');
  const [codespace, setCodespace] = useState<any>(null);
  const [repository, setRepository] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await getDevelopmentEnvironmentStatus(projectId);
      setStatus(response.data.status);
      setCodespace(response.data.codespace);
      setRepository(response.data.repository);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll status every 30 seconds if creating
    const interval = setInterval(() => {
      if (status === 'creating') {
        fetchStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [projectId, status]);

  const handleCreateEnvironment = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await createDevelopmentEnvironment(projectId);
      setStatus('creating');
      setCodespace(response.data.codespace);
      setRepository(response.data.repository);
      onEnvironmentCreated?.();
      
      // Start polling for status updates
      setTimeout(fetchStatus, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to create development environment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCodespace = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await startDevelopmentEnvironment(projectId);
      setStatus('creating');
      setTimeout(fetchStatus, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to start codespace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopCodespace = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await stopDevelopmentEnvironment(projectId);
      setTimeout(fetchStatus, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to stop codespace');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'available':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        );
      case 'creating':
        return (
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
        );
      case 'unavailable':
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full" />
        );
      default:
        return (
          <div className="w-3 h-3 bg-gray-400 rounded-full" />
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'Ready';
      case 'creating':
        return 'Starting...';
      case 'unavailable':
        return 'Stopped';
      default:
        return 'Not Created';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'text-green-600';
      case 'creating':
        return 'text-yellow-600';
      case 'unavailable':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              Development Environment
            </span>
          </div>
          <span className={`text-sm ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {status === 'available' && codespace && (
          <a
            href={codespace.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7h10v10M7 7l10 10" />
            </svg>
            Open Codespace
          </a>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {status === 'none' && (
        <div className="text-center py-6">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            No Development Environment
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Create a GitHub Codespace to start developing your AI service in the cloud.
          </p>
          <button
            onClick={handleCreateEnvironment}
            disabled={isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Environment
              </>
            )}
          </button>
        </div>
      )}

      {status === 'creating' && (
        <div className="text-center py-6">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Setting up your environment...
          </h3>
          <p className="text-sm text-gray-600">
            This may take a few minutes. We're creating your repository and codespace.
          </p>
        </div>
      )}

      {status === 'unavailable' && codespace && (
        <div className="text-center py-6">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Environment Stopped
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your development environment is currently stopped. Start it to continue coding.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleStartCodespace}
              disabled={isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15" />
                  </svg>
                  Start Environment
                </>
              )}
            </button>
            {repository && (
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                View Repository
              </a>
            )}
          </div>
        </div>
      )}

      {status === 'available' && codespace && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Machine:</span>
            <span className="font-medium">{codespace.machine?.displayName || 'Basic'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last used:</span>
            <span className="font-medium">
              {new Date(codespace.lastUsedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between pt-2">
            <button
              onClick={handleStopCodespace}
              disabled={isLoading}
              className="btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-3 h-3 mr-1" />
                  Stopping...
                </>
              ) : (
                'Stop Environment'
              )}
            </button>
            {repository && (
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline btn-sm"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Repository
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodespaceStatus;