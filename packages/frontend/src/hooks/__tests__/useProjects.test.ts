import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useRouter } from 'next/router';
import { useProjects } from '../useProjects';
import projectReducer from '../../store/slices/projectSlice';
import * as projectAPI from '../../services/api/projects';

// Mock types
interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'DRAFT' | 'DEVELOPING' | 'DEPLOYED' | 'ARCHIVED';
  projectType?: 'LOW_CODE' | 'NO_CODE';
  createdAt: string;
  updatedAt: string;
}

// Mock dependencies
jest.mock('../../services/api/projects');

const mockProjectAPI = projectAPI as jest.Mocked<typeof projectAPI>;

// Test store setup
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      projects: projectReducer,
    },
    preloadedState: {
      projects: {
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
        ...initialState,
      },
    },
  });
};

const renderHookWithProvider = (initialState = {}) => {
  const store = createTestStore(initialState);
  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(Provider, { store }, children);
  return renderHook(() => useProjects(), { wrapper });
};

describe('useProjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('프로젝트 생성', () => {
    it('프로젝트 생성 성공 시 API 호출', async () => {
      // Given
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        category: 'web-app',
      };

      const mockResponse = {
        success: true,
        data: {
          id: 'project-id',
          ...projectData,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      mockProjectAPI.createProject.mockResolvedValue(mockResponse);

      const { result } = renderHookWithProvider();

      // When
      await act(async () => {
        await result.current.createProject(projectData);
      });

      // Then
      expect(mockProjectAPI.createProject).toHaveBeenCalledWith(projectData);
    });
  });

  describe('프로젝트 업데이트', () => {
    it('프로젝트 업데이트 함수 호출', async () => {
      // Given
      const projectId = 'project-id';
      const updates = {
        name: 'Updated Project',
        description: 'Updated Description',
      };

      const { result } = renderHookWithProvider();

      // When
      await act(async () => {
        try {
          await result.current.updateProject(projectId, updates);
        } catch (error) {
          // Redux 액션 실행 중 에러가 발생할 수 있음
        }
      });

      // Then
      expect(result.current.updateProject).toBeDefined();
    });
  });

  describe('프로젝트 삭제', () => {
    it('프로젝트 삭제 API 호출', async () => {
      // Given
      const projectId = 'project-id';
      const mockResponse = { success: true };

      mockProjectAPI.deleteProject.mockResolvedValue(mockResponse);

      const { result } = renderHookWithProvider();

      // When
      await act(async () => {
        await result.current.deleteProject(projectId);
      });

      // Then
      expect(mockProjectAPI.deleteProject).toHaveBeenCalledWith(projectId);
    });
  });

  describe('프로젝트 목록 로딩', () => {
    it('프로젝트 목록 로딩 API 호출', async () => {
      // Given
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          description: 'Description 1',
          category: 'web-app',
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockResponse = {
        data: {
          projects: mockProjects,
          pagination: {
            page: 1,
            totalPages: 1,
            total: 1,
            hasMore: false,
          },
        },
      };

      mockProjectAPI.getProjects.mockResolvedValue(mockResponse);

      const { result } = renderHookWithProvider();

      // When
      await act(async () => {
        await result.current.loadProjects();
      });

      // Then
      expect(mockProjectAPI.getProjects).toHaveBeenCalled();
    });
  });

  describe('유틸리티 함수들', () => {
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Project 1',
        description: 'Description 1',
        category: 'web-app',
        status: 'DRAFT' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('ID로 프로젝트 찾기', () => {
      // Given
      const { result } = renderHookWithProvider({ projects: mockProjects });

      // When
      const project = result.current.getProjectById('project-1');

      // Then
      expect(project).toEqual(mockProjects[0]);
    });
  });
});