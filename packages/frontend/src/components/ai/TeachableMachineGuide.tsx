import React, { useState } from 'react';

interface TeachableMachineGuideProps {
  onModelUrlSubmit: (url: string, modelType: string) => void;
  isLoading?: boolean;
}

const TeachableMachineGuide: React.FC<TeachableMachineGuideProps> = ({
  onModelUrlSubmit,
  isLoading = false,
}) => {
  const [step, setStep] = useState(1);
  const [modelUrl, setModelUrl] = useState('');
  const [modelType, setModelType] = useState('image');
  const [urlError, setUrlError] = useState('');

  const validateModelUrl = (url: string): boolean => {
    const teachableMachinePattern = /^https:\/\/teachablemachine\.withgoogle\.com\/models\/[a-zA-Z0-9_-]+\/?$/;
    return teachableMachinePattern.test(url);
  };

  const handleUrlSubmit = () => {
    setUrlError('');
    
    if (!modelUrl.trim()) {
      setUrlError('Please enter a model URL');
      return;
    }

    if (!validateModelUrl(modelUrl)) {
      setUrlError('Please enter a valid Teachable Machine model URL');
      return;
    }

    onModelUrlSubmit(modelUrl, modelType);
  };

  const steps = [
    {
      title: 'Create Your AI Model',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            First, you'll need to create and train your AI model using Google's Teachable Machine.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What you'll do:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Visit Teachable Machine website</li>
              <li>• Choose your project type (Image, Audio, or Pose)</li>
              <li>• Upload and label your training data</li>
              <li>• Train your model</li>
              <li>• Export your model</li>
            </ul>
          </div>
          <div className="flex justify-center">
            <a
              href="https://teachablemachine.withgoogle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7h10v10M7 7l10 10" />
              </svg>
              Open Teachable Machine
            </a>
          </div>
        </div>
      ),
    },
    {
      title: 'Export Your Model',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            After training your model, you need to export it to get the shareable URL.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Click "Export Model"</p>
                <p className="text-xs text-gray-600">Look for the export button after training is complete</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Choose "Tensorflow.js"</p>
                <p className="text-xs text-gray-600">Select the web-compatible format</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Copy the "Shareable Link"</p>
                <p className="text-xs text-gray-600">This is the URL you'll paste in the next step</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Make sure to copy the shareable link, not the download link. 
                  The URL should start with "https://teachablemachine.withgoogle.com/models/"
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Connect Your Model',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Paste your Teachable Machine model URL below to connect it to your project.
          </p>
          
          <div>
            <label htmlFor="modelType" className="block text-sm font-medium text-gray-700 mb-2">
              Model Type
            </label>
            <select
              id="modelType"
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="input w-full"
            >
              <option value="image">Image Classification</option>
              <option value="audio">Audio Classification</option>
              <option value="pose">Pose Detection</option>
            </select>
          </div>

          <div>
            <label htmlFor="modelUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Model URL
            </label>
            <input
              id="modelUrl"
              type="url"
              value={modelUrl}
              onChange={(e) => {
                setModelUrl(e.target.value);
                setUrlError('');
              }}
              placeholder="https://teachablemachine.withgoogle.com/models/your-model-id/"
              className={`input w-full ${urlError ? 'input-error' : ''}`}
            />
            {urlError && (
              <p className="mt-1 text-sm text-red-600">{urlError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Example: https://teachablemachine.withgoogle.com/models/abc123def456/
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  <strong>What happens next:</strong> We'll test your model connection and integrate it into your AI service code automatically.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUrlSubmit}
            disabled={isLoading || !modelUrl.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-4 h-4 mr-2" />
                Connecting Model...
              </>
            ) : (
              'Connect Model'
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {steps.map((_, index) => (
            <React.Fragment key={index}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > index + 1 
                  ? 'bg-green-600 text-white' 
                  : step === index + 1 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step > index + 1 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 ${
                  step > index + 1 ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">
            Step {step}: {steps[step - 1].title}
          </h2>
        </div>
        <div className="card-body">
          {steps[step - 1].content}
        </div>
        
        {step < 3 && (
          <div className="card-footer">
            <div className="flex justify-between">
              <button
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="btn-primary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Check out the <a href="https://teachablemachine.withgoogle.com/faq" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">Teachable Machine FAQ</a></p>
          <p>• Watch <a href="https://www.youtube.com/results?search_query=teachable+machine+tutorial" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">tutorial videos</a> on YouTube</p>
          <p>• Visit our <Link href="/community" className="text-primary-600 hover:text-primary-500">community forum</Link> for support</p>
        </div>
      </div>
    </div>
  );
};

export default TeachableMachineGuide;