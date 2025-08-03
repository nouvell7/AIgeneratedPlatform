import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '@/types';
import * as projectAPI from '../../services/api/projects';

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
  },
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params?: { page?: number; limit?: number; filters?: any }) => {
    const response = await projectAPI.getProjects(params);
    return response.data;
  }
);

export const fetchProject = createAsyncThunk(
  'projects/fetchProject',
  async (projectId: string) => {
    const response = await projectAPI.getProject(projectId);
    return response.data;
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: { name: string; description: string; category: string }) => {
    const response = await projectAPI.createProject(projectData);
    return response.data;
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }: { id: string; data: Partial<Project> }) => {
    const response = await projectAPI.updateProject(id, data);
    return response.data;
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId: string) => {
    await projectAPI.deleteProject(projectId);
    return projectId;
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    clearProjects: (state) => {
      state.projects = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    // Fetch projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.projects;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      });

    // Fetch single project
    builder
      .addCase(fetchProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload.project;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch project';
      });

    // Create project
    builder
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.unshift(action.payload.project);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create project';
      });

    // Update project
    builder
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.project.id);
        if (index !== -1) {
          state.projects[index] = action.payload.project;
        }
        if (state.currentProject?.id === action.payload.project.id) {
          state.currentProject = action.payload.project;
        }
      });

    // Delete project
    builder.addCase(deleteProject.fulfilled, (state, action) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
      }
    });
  },
});

export const { clearError, setCurrentProject, clearProjects } = projectSlice.actions;
export default projectSlice.reducer;