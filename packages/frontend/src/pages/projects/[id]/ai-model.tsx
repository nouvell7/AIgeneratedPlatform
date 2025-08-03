import { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TeachableMachineGuide from '@/components/ai/TeachableMachineGuide';
import ModelTestInterface from '@/components/ai/ModelTestInterface';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchProject, updateProject } from '@/store/slices/projectSlice';

const AIModelPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const { currentProject, isLoading } = useAppSelector((state) => state.projects);
  const [currentStep, setCurrentStep] = useState<'guide' | 'test' | 'complete'>('guide');
  const [modelConfig, setModelConfig] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject?.aiModel) {
      setModelConfig(currentProject.aiModel);
      setCurrentStep('test');
    }
  }, [currentProject]);

  const handleModelUrlSubmit = async (url: string, modelType: string) => {
    if (!currentProject) return;

    setIsUpdating(true);
    try {
      const aiModelConfig = {
        type: 'teachable-machine',
        modelUrl: url,
        modelType,
        configuration: {
          inputType: modelType,
          outputType: 'classification',
        },
      };

      await dispatch(updateProject({
        id: currentProject.id,
        data: { aiModel: aiModelConfig },
      })).unwrap();

      setModelConfig(aiModelConfig);
      setCurrentStep('test');
    } catch (error) {
      console.error('Failed to update AI model:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestComplete = () => {
    setCurrentStep('complete');
  };

  const handleReconfigure = () => {
    setCurrentStep('guide');
    setModelConfig(null);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout showSidebar>
          <div className="p-6">
            <div className="animate-pulse">
              <div className="skeleton h-8 w-64 mb-4"></div>
              <div className="skeleton h-4 w-96 mb-8"></div>
              <div className="skeleton h-96 rounded-lg"></div>
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
        <title>AI Model - {currentProject.name} - AI Service Platform</title>
        <meta name="description" content={`Configure AI model for ${currentProject.name}`} />
      </Head>

      <ProtectedRoute>
        <Layout showSidebar>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Link
                    href={`/projects/${currentProject.id}`}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                  <h1 className="text-2xl font-bold text-gray-900">AI Model Configuration</h1>
                </div>
                <p className="text-gray-600">
                  Configure and test your AI model for {currentProject.name}
                </p>
              </div>

              {modelConfig && (
                <button
                  onClick={handleReconfigure}
                  className="btn-outline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Reconfigure
                </button>
              )}
            </div>

            {/* Content based on current step */}
            {currentStep === 'guide' && (
              <TeachableMachineGuide
                onModelUrlSubmit={handleModelUrlSubmit}
                isLoading={isUpdating}
              />
            )}

            {currentStep === 'test' && modelConfig && (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        AI Model Connected Successfully!
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your Teachable Machine model has been connected to your project. Test it below to make sure it's working correctly.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Model Test Interface */}
                <ModelTestInterface
                  modelUrl={modelConfig.modelUrl}
                  modelType={modelConfig.modelType || 'image'}
                  onTestResult={handleTestComplete}
                />

                {/* Next Steps */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">Next Steps</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary-600">1</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Create Development Environment</p>
                          <p className="text-xs text-gray-600">Set up a GitHub Codespace to start coding your AI service</p>
                          <Link
                            href={`/projects/${currentProject.id}`}
                            className="text-xs text-primary-600 hover:text-primary-500"
                          >
                            Go to project dashboard →
                          </Link>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary-600">2</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Customize Your Service</p>
                          <p className="text-xs text-gray-600">Modify the generated code to match your specific needs</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary-600">3</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Deploy Your Service</p>
                          <p className="text-xs text-gray-600">Deploy to Cloudflare Pages and make it available online</p>
                          <Link
                            href={`/projects/${currentProject.id}/deploy`}
                            className="text-xs text-primary-600 hover:text-primary-500"
                          >
                            Start deployment →
                          </Link>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary-600">4</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Setup Monetization</p>
                          <p className="text-xs text-gray-600">Connect AdSense to start earning revenue from your service</p>
                          <Link
                            href={`/projects/${currentProject.id}/revenue`}
                            className="text-xs text-primary-600 hover:text-primary-500"
                          >
                            Setup revenue →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  AI Model Setup Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your AI model is connected and tested. You're ready to start building your service.
                </p>
                <div className="flex justify-center space-x-4">
                  <Link
                    href={`/projects/${currentProject.id}`}
                    className="btn-primary"
                  >
                    Go to Project Dashboard
                  </Link>
                  <Link
                    href={`/projects/${currentProject.id}/deploy`}
                    className="btn-outline"
                  >
                    Deploy Service
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default AIModelPage;