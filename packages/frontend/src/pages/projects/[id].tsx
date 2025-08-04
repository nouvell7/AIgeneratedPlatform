import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CodespaceStatus from '@/components/projects/CodespaceStatus';
import NoCodeEditor from '@/components/projects/NoCodeEditor'; // Import NoCodeEditor
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchProject, deleteProject } from '@/store/slices/projectSlice';
import { updateProjectPageContent } from '@/services/api/projects'; // Import API function

const ProjectDetailPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const { currentProject, isLoading } = useAppSelector((state) => state.projects);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id]);

  const handleSavePageContent = async (content: Record<string, any>) => {
    if (currentProject?.id) {
      await updateProjectPageContent(currentProject.id, content);
      dispatch(fetchProject(currentProject.id)); // Refresh project data
    }
  };

  const handleDeleteProject = async () => {
    if (currentProject) {
      await dispatch(deleteProject(currentProject.id));
      router.push('/projects');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DEPLOYED':
        return 'badge-success';
      case 'DEVELOPING':
        return 'badge-warning';
      case 'ARCHIVED':
        return 'badge-secondary';
      default:
        return 'badge-primary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DEPLOYED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'DEVELOPING':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'ARCHIVED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout showSidebar>
          <div className="p-6">
            <div className="animate-pulse">
              <div className="skeleton h-8 w-64 mb-4"></div>
              <div className="skeleton h-4 w-96 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="skeleton h-64 rounded-lg"></div>
                </div>
                <div>
                  <div className="skeleton h-48 rounded-lg"></div>
                </div>
              </div>
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
        <title>{currentProject.name} - AI Service Platform</title>
        <meta name="description" content={currentProject.description} />
      </Head>

      <ProtectedRoute>
        <Layout showSidebar>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Link
                    href="/projects"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                  <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
                  <div className={`badge ${getStatusColor(currentProject.status)} flex items-center space-x-1`}>
                    {getStatusIcon(currentProject.status)}
                    <span>{currentProject.status}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{currentProject.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Category: {currentProject.category}</span>
                  <span>•</span>
                  <span>Created {new Date(currentProject.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Updated {new Date(currentProject.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Link
                  href={`/projects/${currentProject.id}/edit`}
                  className="btn-outline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {currentProject.projectType === 'NO_CODE' ? (
                  <NoCodeEditor
                    projectId={currentProject.id}
                    initialContent={currentProject.pageContent || {}}
                    onSave={handleSavePageContent}
                  />
                ) : (
                  <>
                    {/* Development Environment */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Development Environment</h2>
                      <CodespaceStatus
                        projectId={currentProject.id}
                        onEnvironmentCreated={() => {
                          // Refresh project data
                          dispatch(fetchProject(currentProject.id));
                        }}
                      />
                    </div>

                    {/* AI Model Configuration */}
                    <div className="card">
                      <div className="card-header">
                        <h2 className="text-lg font-semibold text-gray-900">AI Model Configuration</h2>
                      </div>
                      <div className="card-body">
                        {currentProject.aiModel ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Model Type:</span>
                              <span className="text-sm text-gray-900">{(currentProject.aiModel as any).type || 'Teachable Machine'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Model URL:</span>
                              <a
                                href={(currentProject.aiModel as any).modelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:text-primary-500 truncate max-w-xs"
                              >
                                {(currentProject.aiModel as any).modelUrl}
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">No AI Model Configured</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Add your Teachable Machine model to get started with AI predictions.
                            </p>
                            <Link
                              href={`/projects/${currentProject.id}/edit`}
                              className="btn-primary btn-sm"
                            >
                              Configure Model
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deployment Status */}
                    <div className="card">
                      <div className="card-header">
                        <h2 className="text-lg font-semibold text-gray-900">Deployment Status</h2>
                      </div>
                      <div className="card-body">
                        {currentProject.deploymentConfig && (currentProject.deploymentConfig as any).deploymentUrl ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Status:</span>
                              <span className="badge badge-success">Deployed</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">URL:</span>
                              <a
                                href={(currentProject.deploymentConfig as any).deploymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:text-primary-500"
                              >
                                Visit Site
                              </a>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">Last Deployed:</span>
                              <span className="text-sm text-gray-900">
                                {new Date((currentProject.deploymentConfig as any).lastDeployedAt || currentProject.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Not Deployed</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Deploy your AI service to make it available online.
                            </p>
                            <Link
                              href={`/projects/${currentProject.id}/deploy`}
                              className="btn-primary btn-sm"
                            >
                              Deploy Now
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      <Link
                        href={`/projects/${currentProject.id}/edit`}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Edit Project</span>
                      </Link>

                      {currentProject.projectType === 'NO_CODE' ? (
                        <Link
                          href={`/projects/${currentProject.id}/deploy`} // Link to a simplified deploy page for no-code
                          className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">Deploy Page</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/projects/${currentProject.id}/deploy`}
                          className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">Deploy Service</span>
                        </Link>
                      )}

                      <Link
                        href={`/projects/${currentProject.id}/analytics`}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">View Analytics</span>
                      </Link>

                      <Link
                        href={`/projects/${currentProject.id}/revenue`}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Setup Revenue</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">Project Stats</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Views</span>
                        <span className="text-sm font-medium text-gray-900">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Deployments</span>
                        <span className="text-sm font-medium text-gray-900">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Revenue</span>
                        <span className="text-sm font-medium text-gray-900">$0.00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Uptime</span>
                        <span className="text-sm font-medium text-gray-900">-</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete "{currentProject.name}"? This will permanently delete the project and all associated data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProject}
                  className="btn-primary bg-red-600 hover:bg-red-700"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectDetailPage;
