import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Template } from '../../../shared/src/types';
import * as templateAPI from '../../services/api/templates';

export interface TemplateState {
  templates: Template[];
  featuredTemplates: Template[];
  popularTemplates: Template[];
  categories: Array<{ category: string; count: number }>;
  selectedTemplate: Template | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: TemplateState = {
  templates: [],
  featuredTemplates: [],
  popularTemplates: [],
  categories: [],
  selectedTemplate: null,
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
export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async (params?: { page?: number; limit?: number; filters?: any }) => {
    const response = await templateAPI.getTemplates(params);
    return response.data;
  }
);

export const fetchFeaturedTemplates = createAsyncThunk(
  'templates/fetchFeatured',
  async () => {
    const response = await templateAPI.getFeaturedTemplates();
    return response.data;
  }
);

export const fetchPopularTemplates = createAsyncThunk(
  'templates/fetchPopular',
  async () => {
    const response = await templateAPI.getPopularTemplates();
    return response.data;
  }
);

export const fetchTemplateCategories = createAsyncThunk(
  'templates/fetchCategories',
  async () => {
    const response = await templateAPI.getTemplateCategories();
    return response.data;
  }
);

const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setSelectedTemplate: (state, action) => {
      state.selectedTemplate = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch templates
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload.templates;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch templates';
      });

    // Fetch featured templates
    builder
      .addCase(fetchFeaturedTemplates.fulfilled, (state, action) => {
        state.featuredTemplates = action.payload.templates;
      });

    // Fetch popular templates
    builder
      .addCase(fetchPopularTemplates.fulfilled, (state, action) => {
        state.popularTemplates = action.payload.templates;
      });

    // Fetch categories
    builder
      .addCase(fetchTemplateCategories.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
      });
  },
});

export const { setSelectedTemplate, clearError } = templateSlice.actions;
export default templateSlice.reducer;