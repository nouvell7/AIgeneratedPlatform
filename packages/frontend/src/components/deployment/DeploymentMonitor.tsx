import React, { useState, useEffect, useRef } from 'react';
import { 
  getDeploymentStatus, 
  getDeploymentLogs, 
  cancelDeployment,
  DeploymentStatus,
  DeploymentLog 
} from '../../services/api/deployment';

interface DeploymentMonitorProps {
  projectId: string;
  deploymentId?: string;
  onDeploymentComplete?: (deployment: DeploymentStatus) => void;
  onDeploymentFailed?: (deployment: DeploymentStatus) => void;
}

const DeploymentMonitor: React.FC<DeploymentMonitorProps> = ({
  projectId,
  deploymentId,
  onDeploymentComplete,
  onDeploymentFailed,
}) => {
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchDeploymentStatus();
      fetchLogs();
      
      // Poll for updates every 5 seconds
      intervalRef.current = setInterval(() => {
        fetchDeploymentStatus();
        fetchLogs();
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [projectId, deploymentId]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    if (deployment) {
      if (deployment.status === 'success') {
        onDeploymentComplete?.(deployment);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else if (deployment.status === 'failed') {
        onDeploymentFailed?.(deployment);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }
  }, [deployment, onDeploymentComplete, onDeploymentFailed]);

  const fetchDeploymentStatus = async () => {
    try {
      const response = await getDeploymentStatus(projectId);
      setDeployment(response.data);
    } catch (error) {
      console.error('Failed to fetch deployment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await getDeploymentLogs(projectId, deploymentId);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleCancelDeployment = async () => {
    if (!deployment || !window.confirm('Are you sure you want to cancel this deployment?')) {
      return;
    }

    try {
      await cancelDeployment(projectId, deployment.id);
      fetchDeploymentStatus();
    } catch (error) {
      console.error('Failed to cancel deployment:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />
        );
      case 'building':
        return (
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-spin">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        );
      case 'success':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <div className="w-4 h-4 bg-gray-400 rounded-full" />
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'building':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600';
      case 'warn':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="animate-pulse">
            <div className="skeleton h-6 w-48 mb-4"></div>
            <div className="skeleton h-4 w-full mb-2"></div>
            <div className="skeleton h-4 w-3/4 mb-2"></div>
            <div className="skeleton h-32 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Deployment Found</h3>
            <p className="text-gray-600">This project hasn't been deployed yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deployment Status */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(deployment.status)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Deployment Status
                </h3>
                <p className={`text-sm font-medium ${getStatusColor(deployment.status)}`}>
                  {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                </p>
              </div>
            </div>
            
            {deployment.status === 'building' && (
              <button
                onClick={handleCancelDeployment}
                className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
              >
                Cancel Deployment
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Platform</p>
              <p className="text-sm text-gray-900 capitalize">{deployment.platform}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Started</p>
              <p className="text-sm text-gray-900">
                {new Date(deployment.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Duration</p>
              <p className="text-sm text-gray-900">
                {formatDuration(deployment.createdAt, deployment.completedAt)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">URL</p>
              {deployment.url ? (
                <a
                  href={deployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Visit Site
                </a>
              ) : (
                <p className="text-sm text-gray-500">Not available</p>
              )}
            </div>
          </div>

          {deployment.status === 'success' && deployment.url && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Deployment Successful!
                  </h4>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your AI service is now live at:</p>
                    <a
                      href={deployment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      {deployment.url}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {deployment.status === 'failed' && deployment.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">
                    Deployment Failed
                  </h4>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{deployment.error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Build Logs */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Build Logs</h3>
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="mr-2"
                />
                Auto-scroll
              </label>
              <button
                onClick={fetchLogs}
                className="btn-outline btn-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="bg-gray-900 text-gray-100 p-4 max-h-96 overflow-y-auto font-mono text-sm">
            {logs.length > 0 ? (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`text-xs font-medium ${getLogLevelColor(log.level)} uppercase`}>
                      {log.level}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No logs available yet...</p>
                {deployment.status === 'pending' && (
                  <p className="text-sm mt-2">Waiting for deployment to start</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentMonitor;