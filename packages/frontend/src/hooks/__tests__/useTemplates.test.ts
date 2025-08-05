import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTemplates } from '../useTemplates';
import templateSlice, {
  fetchTemplates,
  fetchFeaturedTemplates,
  setSelectedTemplate,
  clearError,
} from '../../store/slices/templateSlice';

// Mock the API calls
jest.mock('../../services/api/templates', () => ({
  getTemplates: jest.fn(),
  getFeaturedTemplates: jest.fn(),
}));

const mockTemplates = [
  {
    id: 'template-1',
    name: 'React Chat App',
    description: 'A real-time chat application built with React',
    category: 'web',
    difficulty: 'intermediate' as const,
    tags: ['react', 'websocket', 'chat'],
    codeTemplate: 'template code here',
    aiModelType: 'teachable-machine',
    previewImages: ['image1.jpg', 'image2.jpg'],
    usageCount: 150,
    rating: 4.5,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: 'template-2',
    name: 'Python ML Model',
    description: 'Machine learning model template',
    category: 'ml',
    difficulty: 'advanced' as const,
    tags: ['python', 'ml', 'tensorflow'],
    codeTemplate: 'python template code',
    aiModelType: 'hugging-face',
    previewImages: ['ml1.jpg'],
    usageCount: 89,
    rating: 4.2,
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  },
];

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      templates: templateSlice,
    },
    preloadedState: {
      templates: {
        templates: mockTemplates,
        featuredTemplates: [],
        selectedTemplate: null,
        isLoading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

const renderHookWithProvider = (initialState = {}) => {
  const store = createMockStore(initialState);
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(Provider, { store }, children);
  };
  return renderHook(() => useTemplates(), { wrapper });
};

describe('useTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('초기 상태를 올바르게 반환', () => {
    const { result } = renderHookWithProvider();

    expect(result.current.templates).toEqual(mockTemplates);
    expect(result.current.featuredTemplates).toEqual([]);
    expect(result.current.selectedTemplate).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('템플릿 선택 기능', () => {
    const { result } = renderHookWithProvider();

    act(() => {
      result.current.selectTemplate(mockTemplates[0]);
    });

    expect(result.current.selectedTemplate).toEqual(mockTemplates[0]);
  });

  it('ID로 템플릿 찾기', () => {
    const { result } = renderHookWithProvider();

    const foundTemplate = result.current.getTemplateById('template-1');
    expect(foundTemplate).toEqual(mockTemplates[0]);

    const notFoundTemplate = result.current.getTemplateById('non-existent');
    expect(notFoundTemplate).toBeUndefined();
  });

  it('카테고리별 템플릿 필터링', () => {
    const { result } = renderHookWithProvider();

    const webTemplates = result.current.getTemplatesByCategory('web');
    expect(webTemplates).toHaveLength(1);
    expect(webTemplates[0].category).toBe('web');

    const mlTemplates = result.current.getTemplatesByCategory('ml');
    expect(mlTemplates).toHaveLength(1);
    expect(mlTemplates[0].category).toBe('ml');
  });

  it('난이도별 템플릿 필터링', () => {
    const { result } = renderHookWithProvider();

    const intermediateTemplates = result.current.getTemplatesByDifficulty('intermediate');
    expect(intermediateTemplates).toHaveLength(1);
    expect(intermediateTemplates[0].difficulty).toBe('intermediate');

    const advancedTemplates = result.current.getTemplatesByDifficulty('advanced');
    expect(advancedTemplates).toHaveLength(1);
    expect(advancedTemplates[0].difficulty).toBe('advanced');
  });

  it('템플릿 검색 기능', () => {
    const { result } = renderHookWithProvider();

    // 이름으로 검색
    const chatResults = result.current.searchTemplates('chat');
    expect(chatResults).toHaveLength(1);
    expect(chatResults[0].name).toContain('Chat');

    // 설명으로 검색
    const mlResults = result.current.searchTemplates('machine learning');
    expect(mlResults).toHaveLength(1);
    expect(mlResults[0].description).toContain('Machine learning');

    // 태그로 검색
    const reactResults = result.current.searchTemplates('react');
    expect(reactResults).toHaveLength(1);
    expect(reactResults[0].tags).toContain('react');

    // 검색 결과 없음
    const noResults = result.current.searchTemplates('nonexistent');
    expect(noResults).toHaveLength(0);
  });

  it('인기 템플릿 정렬', () => {
    const { result } = renderHookWithProvider();

    const popularTemplates = result.current.getPopularTemplates();
    expect(popularTemplates).toHaveLength(2);
    expect(popularTemplates[0].usageCount).toBeGreaterThan(popularTemplates[1].usageCount);
  });

  it('높은 평점 템플릿 정렬', () => {
    const { result } = renderHookWithProvider();

    const highRatedTemplates = result.current.getHighRatedTemplates();
    expect(highRatedTemplates).toHaveLength(2);
    expect(highRatedTemplates[0].rating).toBeGreaterThanOrEqual(highRatedTemplates[1].rating);
  });

  it('에러 상태 처리', () => {
    const { result } = renderHookWithProvider({ error: 'Test error' });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});