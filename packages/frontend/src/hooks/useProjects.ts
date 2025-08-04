import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { RootState } from '../store';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  setCurrentProject,
  clearError,
} from '../store/slices/projectSlice';
import { Project } from '@ai-service-platform/shared';

export const useProjects = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { projects, currentProject, isLoading, error } = useSelector(
    (state: RootState) => state.projects
  );

  const loadProjects = async () => {
    try {
      await dispatch(fetchProjects()).unwrap();
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      const result = await dispatch(createProject(projectData)).unwrap();
      if (result.success) {
        router.push(`/projects/${result.data.id}`);
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateProject = async (
    projectId: string,
    updates: Partial<Project>
  ) => {
    try {
      const result = await dispatch(
        updateProject({ id: projectId, updates })
      ).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const result = await dispatch(deleteProject(projectId)).unwrap();
      if (result.success) {
        router.push('/projects');
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  const selectProject = (project: Project) => {
    dispatch(setCurrentProject(project));
  };

  const clearProjectError = () => {
    dispatch(clearError());
  };

  const getProjectById = (projectId: string) => {
    return projects.find((project) => project.id === projectId);
  };

  const getProjectsByStatus = (status: Project['status']) => {
    return projects.filter((project) => project.status === status);
  };

  return {
    projects,
    currentProject,
    isLoading,
    error,
    loadProjects,
    createProject: handleCreateProject,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject,
    selectProject,
    clearError: clearProjectError,
    getProjectById,
    getProjectsByStatus,
  };
};