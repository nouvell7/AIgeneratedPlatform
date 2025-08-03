import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DeploymentConfig from '@/components/deployment/DeploymentConfig';
import DeploymentMonitor from '@/components/deployment/DeploymentMonitor';
import DeploymentMetrics from '@/components/deployment/DeploymentMetrics';
import ServicePreview from '@/components/deployment/ServicePreview';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchProject } from '@/store/slices/projectSlice';

const DeployPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const { currentProject, isLoading } = useAppSelector((state) => state.projects);
  const [currentTab, setCurrentTab] = useState<'config' | 'monitor' | 'metrics' | 'preview'>('config');
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    // Check if project has existing deployment
    if (currentProject?.deployment) {
      const deployment = currentProject.deployment as any;
      if (deployment.deploymentUrl) {
        setCurrentTab('preview');
      } else if (deployment.status === 'building' || deployment.status === 'pending') {
        setCurrentTab('monitor');
      }
    }
  }, [currentProject]);

  const handleDeploymentStart = (newDeploymentId: string) => {
    setDeploymentId(newDeploymentId);
    setCurrentTab('monitor');
  };

  const handleDeploymentComplete = () => {
    // Refresh project data
    if (currentProject) {
      dispatch(fetchProject(currentProject.id));
    }
    setCurrentTab('preview');
  };

  const handleDeploymentFailed = () => {
    // Stay on monitor tab to show error details
  };

  const tabs = [
    {
      id: 'config' as const,
      name: 'Configuration',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'monitor' as const,
      name: 'Monitor',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'preview' as const,
      name: 'Preview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      id: 'metrics' as const,
      name: 'Metrics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout showSidebar>
          <div className="p-6">
            <div className="animate-pulse">
              <div className="skeleton h-8 w-64 mb-4"></div>
              <div className="skeleton h-4 w-96 mb-8"></div>
              <div className="skeleton h-96 rounded-lg"></div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!currentProject) {
    return (
      <ProtectedRoute>
        <Layout showSidebar>
          <div className="p-6">
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
              <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
              <Link href="/projects" className="btn-primary">
                Back to Projects
              </Link>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <>
      <Head>
        <title>Deploy - {currentProject.name} - AI Service Platform</title>
        <meta name="description" content={`Deploy ${currentProject.name} to the web`} />
      </Head>

      <ProtectedRoute>
        <Layout showSidebar>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Link
                    href={`/projects/${currentProject.id}`}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                  <h1 className="text-2xl font-bold text-gray-900">Deploy Service</h1>
                </div>
                <p className="text-gray-600">
                  Deploy {currentProject.name} to make it available online
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3">
                {currentProject.deployment && (currentProject.deployment as any).deploymentUrl && (
                  <a
                    href={(currentProject.deployment as any).deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7h10v10M7 7l10 10" />
                    </svg>
                    Visit Site
                  </a>
                )}
              </div>
            </div>

            {/* Prerequisites Check */}
            <div className="mb-8">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Prerequisites</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        currentProject.aiModel ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {currentProject.aiModel ? (
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-900">AI Model Connected</span>
                      {!currentProject.aiModel && (
                        <Link
                          href={`/projects/${currentProject.id}/ai-model`}
                          className="text-sm text-primary-600 hover:text-primary-500"
                        >
                          Configure →
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        currentProject.deployment && (currentProject.deployment as any).repositoryUrl ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {currentProject.deployment && (currentProject.deployment as any).repositoryUrl ? (
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-900">Development Environment Ready</span>
                      {!(currentProject.deployment && (currentProject.deployment as any).repositoryUrl) && (
                        <Link
                          href={`/projects/${currentProject.id}`}
                          className="text-sm text-primary-600 hover:text-primary-500"
                        >
                          Create →
                        </Link>
                      )}
                    </div>
                  </div>

                  {(!currentProject.aiModel || !(currentProject.deployment && (currentProject.deployment as any).repositoryUrl)) && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">
                            Please complete the prerequisites before deploying your service.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      currentTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {currentTab === 'config' && (
                <DeploymentConfig
                  projectId={currentProject.id}
                  onDeploymentStart={handleDeploymentStart}
                  initialConfig={currentProject.deployment as any}
                />
              )}

              {currentTab === 'monitor' && (
                <DeploymentMonitor
                  projectId={currentProject.id}
                  deploymentId={deploymentId || undefined}
                  onDeploymentComplete={handleDeploymentComplete}
                  onDeploymentFailed={handleDeploymentFailed}
                />
              )}

              {currentTab === 'preview' && currentProject.deployment && (currentProject.deployment as any).deploymentUrl && (
                <ServicePreview
                  projectId={currentProject.id}
                  serviceUrl={(currentProject.deployment as any).deploymentUrl}
                  previewUrl={(currentProject.deployment as any).previewUrl}
                  projectName={currentProject.name}
                />
              )}

              {currentTab === 'metrics' && (
                <DeploymentMetrics projectId={currentProject.id} />
              )}
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default DeployPage;