import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchProjects, deleteProject } from '@/store/slices/projectSlice';

const ProjectsPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { projects, isLoading, pagination } = useAppSelector((state) => state.projects);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const filters: any = {};
    if (selectedStatus) filters.status = selectedStatus;
    if (selectedCategory) filters.category = selectedCategory;
    if (searchQuery) filters.search = searchQuery;

    dispatch(fetchProjects({ filters, limit: 12 }));
  }, [dispatch, selectedStatus, selectedCategory, searchQuery]);

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await dispatch(deleteProject(projectId));
    }
  };

  const handleCreateSuccess = (project: any) => {
    // Refresh projects list
    dispatch(fetchProjects({ limit: 12 }));
    // Navigate to the new project
    router.push(`/projects/${project.id}`);
  };

  const categories = [
    { value: 'image-classification', label: 'Image Classification' },
    { value: 'text-analysis', label: 'Text Analysis' },
    { value: 'audio-recognition', label: 'Audio Recognition' },
    { value: 'pose-detection', label: 'Pose Detection' },
    { value: 'object-detection', label: 'Object Detection' },
    { value: 'sentiment-analysis', label: 'Sentiment Analysis' },
    { value: 'chatbot', label: 'Chatbot' },
    { value: 'recommendation', label: 'Recommendation System' },
    { value: 'other', label: 'Other' },
  ];

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

  return (
    <>
      <Head>
        <title>Projects - AI Service Platform</title>
        <meta name="description" content="Manage your AI service projects" />
      </Head>

      <ProtectedRoute>
        <Layout showSidebar>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
              <p className="text-gray-600 mt-1">
                Manage and monitor your AI service projects
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input sm:w-48"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input sm:w-48"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="DEVELOPING">Developing</option>
              <option value="DEPLOYED">Deployed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="card-body">
                    <div className="skeleton h-6 w-3/4 mb-3"></div>
                    <div className="skeleton h-4 w-full mb-2"></div>
                    <div className="skeleton h-4 w-2/3 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="skeleton h-6 w-16"></div>
                      <div className="skeleton h-8 w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="card hover:shadow-lg transition-shadow">
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/projects/${project.id}/edit`)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className={`badge ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {project.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                      <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="btn-outline flex-1 justify-center text-sm"
                      >
                        View
                      </Link>
                      {project.status === 'DEPLOYED' && (
                        <button className="btn-primary flex-1 justify-center text-sm">
                          Visit Site
                        </button>
                      )}
                      {project.status !== 'DEPLOYED' && (
                        <Link
                          href={`/projects/${project.id}/deploy`}
                          className="btn-primary flex-1 justify-center text-sm"
                        >
                          Deploy
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || selectedStatus ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedStatus 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first AI service project'
                }
              </p>
              {!searchQuery && !selectedStatus && !selectedCategory && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary"
                >
                  Create Your First Project
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center mt-8 space-x-2">
              <button
                disabled={pagination.page === 1}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={!pagination.hasMore}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
        </Layout>
      </ProtectedRoute>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default ProjectsPage;