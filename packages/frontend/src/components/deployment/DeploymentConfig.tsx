import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getDeploymentPlatforms,
  testDeploymentConfig,
  startDeployment,
  DeploymentConfig as IDeploymentConfig,
} from '../../services/api/deployment';

const deploymentConfigSchema = z.object({
  platform: z.enum(['cloudflare-pages', 'vercel', 'netlify']),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
  nodeVersion: z.string().optional(),
  environmentVariables: z.record(z.string()).optional(),
});

type DeploymentConfigForm = z.infer<typeof deploymentConfigSchema>;

interface DeploymentConfigProps {
  projectId: string;
  onDeploymentStart: (deploymentId: string) => void;
  initialConfig?: Partial<IDeploymentConfig>;
}

const DeploymentConfig: React.FC<DeploymentConfigProps> = ({
  projectId,
  onDeploymentStart,
  initialConfig,
}) => {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    issues?: string[];
  } | null>(null);
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>(
    []
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeploymentConfigForm>({
    resolver: zodResolver(deploymentConfigSchema),
    defaultValues: {
      platform: initialConfig?.platform || 'cloudflare-pages',
      buildCommand: initialConfig?.buildCommand || 'npm run build',
      outputDirectory: initialConfig?.outputDirectory || 'dist',
      nodeVersion: initialConfig?.nodeVersion || '18',
    },
  });

  const selectedPlatform = watch('platform');

  useEffect(() => {
    loadPlatforms();
    if (initialConfig?.environmentVariables) {
      const vars = Object.entries(initialConfig.environmentVariables).map(
        ([key, value]) => ({
          key,
          value,
        })
      );
      setEnvVars(vars);
    }
  }, [initialConfig]);

  const loadPlatforms = async () => {
    try {
      const response = await getDeploymentPlatforms();
      setPlatforms(response.data);
    } catch (error) {
      console.error('Failed to load platforms:', error);
    }
  };

  const handleTestConfig = async (data: DeploymentConfigForm) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const config: IDeploymentConfig = {
        ...data,
        environmentVariables: envVars.reduce(
          (acc, { key, value }) => {
            if (key && value) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        ),
      };

      const response = await testDeploymentConfig(projectId, config);
      setTestResult(response.data);
    } catch (error: any) {
      setTestResult({
        valid: false,
        issues: [error.message || 'Configuration test failed'],
      });
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (data: DeploymentConfigForm) => {
    setIsLoading(true);

    try {
      const config: IDeploymentConfig = {
        ...data,
        environmentVariables: envVars.reduce(
          (acc, { key, value }) => {
            if (key && value) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        ),
      };

      const response = await startDeployment(projectId, config);
      onDeploymentStart(response.data.id);
    } catch (error) {
      console.error('Failed to start deployment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const selectedPlatformInfo = platforms.find(p => p.id === selectedPlatform);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            Deployment Configuration
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure how your AI service will be deployed and hosted
          </p>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Deployment Platform
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {platforms.map(platform => (
                  <label
                    key={platform.id}
                    className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      selectedPlatform === platform.id
                        ? 'border-primary-600 ring-2 ring-primary-600'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      {...register('platform')}
                      type="radio"
                      value={platform.id}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {platform.name}
                          </p>
                          <p className="text-gray-500">
                            {platform.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Builds: {platform.limits.builds}</p>
                        <p>Bandwidth: {platform.limits.bandwidth}</p>
                      </div>
                    </div>
                    {selectedPlatform === platform.id && (
                      <div className="absolute -inset-px rounded-lg border-2 border-primary-600 pointer-events-none" />
                    )}
                  </label>
                ))}
              </div>
              {errors.platform && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.platform.message}
                </p>
              )}
            </div>

            {/* Platform Info */}
            {selectedPlatformInfo && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  {selectedPlatformInfo.name} Features
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {selectedPlatformInfo.features.map(
                    (feature: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Build Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="buildCommand"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Build Command
                </label>
                <input
                  {...register('buildCommand')}
                  type="text"
                  className="input w-full"
                  placeholder="npm run build"
                />
                {errors.buildCommand && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.buildCommand.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="outputDirectory"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Output Directory
                </label>
                <input
                  {...register('outputDirectory')}
                  type="text"
                  className="input w-full"
                  placeholder="dist"
                />
                {errors.outputDirectory && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.outputDirectory.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="nodeVersion"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Node.js Version
              </label>
              <select
                {...register('nodeVersion')}
                className="input w-full md:w-48"
              >
                <option value="18">Node.js 18 (Recommended)</option>
                <option value="16">Node.js 16</option>
                <option value="20">Node.js 20</option>
              </select>
              {errors.nodeVersion && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.nodeVersion.message}
                </p>
              )}
            </div>

            {/* Environment Variables */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Environment Variables
                </label>
                <button
                  type="button"
                  onClick={addEnvVar}
                  className="btn-outline btn-sm"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Variable
                </button>
              </div>

              {envVars.length > 0 && (
                <div className="space-y-2">
                  {envVars.map((envVar, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="KEY"
                        value={envVar.key}
                        onChange={e =>
                          updateEnvVar(index, 'key', e.target.value)
                        }
                        className="input flex-1"
                      />
                      <input
                        type="text"
                        placeholder="value"
                        value={envVar.value}
                        onChange={e =>
                          updateEnvVar(index, 'value', e.target.value)
                        }
                        className="input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeEnvVar(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Environment variables will be available during build and runtime
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`p-4 rounded-lg ${
                  testResult.valid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex">
                  <svg
                    className={`w-5 h-5 ${
                      testResult.valid ? 'text-green-400' : 'text-red-400'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {testResult.valid ? (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  <div className="ml-3">
                    <h4
                      className={`text-sm font-medium ${
                        testResult.valid ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {testResult.valid
                        ? 'Configuration Valid'
                        : 'Configuration Issues'}
                    </h4>
                    {testResult.issues && testResult.issues.length > 0 && (
                      <div
                        className={`mt-2 text-sm ${
                          testResult.valid ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        <ul className="list-disc list-inside space-y-1">
                          {testResult.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleSubmit(handleTestConfig)}
                disabled={isTesting}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2" />
                    Testing...
                  </>
                ) : (
                  'Test Configuration'
                )}
              </button>

              <button
                type="submit"
                disabled={isLoading || (testResult && !testResult.valid)}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2" />
                    Starting Deployment...
                  </>
                ) : (
                  'Deploy Now'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeploymentConfig;
