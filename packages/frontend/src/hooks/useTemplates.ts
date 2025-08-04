import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  fetchTemplates,
  fetchFeaturedTemplates,
  setSelectedTemplate,
  clearError,
} from '../store/slices/templateSlice';
import { Template } from '@ai-service-platform/shared';

export const useTemplates = () => {
  const dispatch = useDispatch();
  const { templates, featuredTemplates, selectedTemplate, isLoading, error } =
    useSelector((state: RootState) => state.templates);

  const loadTemplates = async (filters?: {
    category?: string;
    difficulty?: string;
    search?: string;
  }) => {
    try {
      await dispatch(fetchTemplates(filters)).unwrap();
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadFeaturedTemplates = async () => {
    try {
      await dispatch(fetchFeaturedTemplates()).unwrap();
    } catch (error) {
      console.error('Failed to load featured templates:', error);
    }
  };

  const selectTemplate = (template: Template) => {
    dispatch(setSelectedTemplate(template));
  };

  const clearTemplateError = () => {
    dispatch(clearError());
  };

  const getTemplateById = (templateId: string) => {
    return templates.find((template) => template.id === templateId);
  };

  const getTemplatesByCategory = (category: string) => {
    return templates.filter((template) => template.category === category);
  };

  const getTemplatesByDifficulty = (difficulty: Template['difficulty']) => {
    return templates.filter((template) => template.difficulty === difficulty);
  };

  const searchTemplates = (query: string) => {
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        template.description.toLowerCase().includes(query.toLowerCase()) ||
        template.tags.some((tag) =>
          tag.toLowerCase().includes(query.toLowerCase())
        )
    );
  };

  const getPopularTemplates = () => {
    return [...templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
  };

  const getHighRatedTemplates = () => {
    return [...templates]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
  };

  return {
    templates,
    featuredTemplates,
    selectedTemplate,
    isLoading,
    error,
    loadTemplates,
    loadFeaturedTemplates,
    selectTemplate,
    clearError: clearTemplateError,
    getTemplateById,
    getTemplatesByCategory,
    getTemplatesByDifficulty,
    searchTemplates,
    getPopularTemplates,
    getHighRatedTemplates,
  };
};