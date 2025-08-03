import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../store';
import { createProject } from '../../store/slices/projectSlice';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(50, 'Project name must be less than 50 characters'),
  description: z.string().min(1, 'Description is required').max(200, 'Description must be less than 200 characters'),
  category: z.string().min(1, 'Category is required'),
  aiModelUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (project: any) => void;
}

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

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.projects);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  const watchedCategory = watch('category');

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      const projectData = {
        name: data.name,
        description: data.description,
        category: data.category,
        aiModel: data.aiModelUrl ? {
          type: 'teachable-machine',
          modelUrl: data.aiModelUrl,
          configuration: {},
        } : undefined,
      };

      const result = await dispatch(createProject(projectData)).unwrap();
      
      reset();
      setStep(1);
      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Create New Project
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className={`input w-full ${errors.name ? 'input-error' : ''}`}
                    placeholder="My AI Service"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className={`input w-full ${errors.description ? 'input-error' : ''}`}
                    placeholder="Describe what your AI service will do..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className={`input w-full ${errors.category ? 'input-error' : ''}`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!watchedCategory}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="aiModelUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    AI Model URL (Optional)
                  </label>
                  <input
                    {...register('aiModelUrl')}
                    type="url"
                    className={`input w-full ${errors.aiModelUrl ? 'input-error' : ''}`}
                    placeholder="https://teachablemachine.withgoogle.com/models/..."
                  />
                  {errors.aiModelUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.aiModelUrl.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    You can add your Teachable Machine model URL here, or configure it later.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">
                        What happens next?
                      </h4>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>We'll create your project structure</li>
                          <li>Set up a GitHub repository with AI service template</li>
                          <li>Create a GitHub Codespace for development</li>
                          <li>You can start coding immediately in the cloud</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-outline"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner w-4 h-4 mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;