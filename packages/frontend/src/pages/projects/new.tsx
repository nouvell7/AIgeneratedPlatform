import { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, CreateProjectInput } from '@/lib/schemas';
import Layout from '@/components/layout/Layout';
import { useAppDispatch, useAppSelector } from '@/store';
import { createProject } from '@/store/slices/projectSlice';

const categories = [
  { value: 'image-classification', label: 'Image Classification' },
  { value: 'text-analysis', label: 'Text Analysis' },
  { value: 'audio-recognition', label: 'Audio Recognition' },
  { value: 'pose-detection', label: 'Pose Detection' },
  { value: 'object-detection', label: 'Object Detection' },
  { value: 'sentiment-analysis', label: 'Sentiment Analysis' },
  { value: 'chatbot', label: 'Chatbot' },
  { value: 'recommendation', label: 'Recommendation' },
  { value: 'other', label: 'Other' },
];

const NewProjectPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.projects);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      const result = await dispatch(createProject(data));
      if (createProject.fulfilled.match(result)) {
        router.push(`/projects/${result.payload.project.id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const getCategoryDescription = (category: string) => {
    const descriptions: Record<string, string> = {
      'image-classification': 'Classify images into different categories using AI models',
      'text-analysis': 'Analyze and process text data for insights and patterns',
      'audio-recognition': 'Recognize and classify audio content and speech',
      'pose-detection': 'Detect and analyze human poses in images or videos',
      'object-detection': 'Identify and locate objects within images',
      'sentiment-analysis': 'Analyze the emotional tone of text content',
      'chatbot': 'Create conversational AI interfaces for user interaction',
      'recommendation': 'Build recommendation systems for personalized content',
      'other': 'Custom AI service for your specific use case',
    };
    return descriptions[category] || '';
  };

  return (
    <>
      <Head>
        <title>Create New Project - AI Service Platform</title>
        <meta name="description" content="Create a new AI service project" />
      </Head>

      <Layout showSidebar>
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600 mt-1">
              Build your AI service from scratch or use a template
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-4 ${
                step >= 2 ? 'bg-primary-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-4 ${
                step >= 3 ? 'bg-primary-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Project Details</span>
              <span>Category Selection</span>
              <span>Review & Create</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Project Details */}
            {step === 1 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold">Project Details</h2>
                  <p className="text-gray-600 text-sm">Tell us about your AI service project</p>
                </div>
                <div className="card-body space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      className={`input ${errors.name ? 'input-error' : ''}`}
                      placeholder="Enter your project name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className={`input ${errors.description ? 'input-error' : ''}`}
                      placeholder="Describe what your AI service will do..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-primary"
                    >
                      Next: Choose Category
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Category Selection */}
            {step === 2 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold">Choose Category</h2>
                  <p className="text-gray-600 text-sm">Select the type of AI service you want to build</p>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <label
                        key={category.value}
                        className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer hover:border-primary-300 transition-colors ${
                          selectedCategory === category.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          {...register('category')}
                          type="radio"
                          value={category.value}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{category.label}</h3>
                          {selectedCategory === category.value && (
                            <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{getCategoryDescription(category.value)}</p>
                      </label>
                    ))}
                  </div>
                  {errors.category && (
                    <p className="mt-4 text-sm text-error-600">{errors.category.message}</p>
                  )}

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-outline"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!selectedCategory}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Review
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Create */}
            {step === 3 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold">Review & Create</h2>
                  <p className="text-gray-600 text-sm">Review your project details before creating</p>
                </div>
                <div className="card-body space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Project Summary</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Name:</dt>
                        <dd className="text-sm font-medium text-gray-900">{watch('name')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Category:</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {categories.find(c => c.value === selectedCategory)?.label}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600 mb-1">Description:</dt>
                        <dd className="text-sm text-gray-900">{watch('description')}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">What happens next?</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          After creating your project, you'll be able to connect AI models, configure deployment settings, and set up monetization options.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-outline"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="loading-spinner w-4 h-4 mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        'Create Project'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </Layout>
    </>
  );
};

export default NewProjectPage;