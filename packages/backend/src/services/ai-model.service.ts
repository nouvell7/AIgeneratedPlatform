import { injectable } from 'tsyringe';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { NotFoundError, ExternalServiceError, ValidationError, InsufficientPermissionsError } from '../utils/errors';
import { loggers } from '../utils/logger';

export interface AIModelConfig {
  type: 'teachable-machine' | 'huggingface' | 'custom';
  modelUrl: string;
  modelId: string;
  configuration: Record<string, any>;
}

export interface TeachableMachineModel {
  modelUrl: string;
  metadataUrl: string;
  weightsUrl: string;
  classes: string[];
  imageSize: number;
  type: 'image' | 'audio' | 'pose';
}

export interface HuggingFaceModel {
  modelId: string;
  task: string;
  pipeline: string;
  apiUrl: string;
  tokenRequired: boolean;
}

@injectable()
export class AIModelService {
  /**
   * Connect AI model to project
   */
  async connectModel(
    projectId: string,
    userId: string,
    modelConfig: AIModelConfig
  ): Promise<void> {
    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.userId !== userId) {
      throw new InsufficientPermissionsError('You can only modify your own projects');
    }

    // Validate model configuration
    await this.validateModelConfig(modelConfig);

    // Update project with AI model configuration
    await prisma.project.update({
      where: { id: projectId },
      data: {
        aiModel: JSON.stringify(modelConfig),
        updatedAt: new Date(),
      },
    });

    loggers.business.projectCreated(projectId, 'ai_model_connected');
  }

  /**
   * Disconnect AI model from project
   */
  async disconnectModel(projectId: string, userId: string): Promise<void> {
    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.userId !== userId) {
      throw new InsufficientPermissionsError('You can only modify your own projects');
    }

    // Remove AI model configuration
    await prisma.project.update({
      where: { id: projectId },
      data: {
        aiModel: null as any,
        updatedAt: new Date(),
      },
    });

    loggers.business.projectCreated(projectId, 'ai_model_disconnected');
  }

  /**
   * Get project's AI model configuration
   */
  async getModelConfig(projectId: string, userId?: string): Promise<AIModelConfig | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: {
            settings: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Check access permissions
    if (userId && project.userId !== userId) {
      const userSettings = JSON.parse(project.user.settings || '{}');
      if (!userSettings?.privacy?.projectsPublic) {
        throw new NotFoundError('Project');
      }
    }

    return project.aiModel ? JSON.parse(project.aiModel) : null;
  }

  /**
   * Test AI model connection
   */
  async testModel(modelConfig: AIModelConfig): Promise<{
    status: 'success' | 'error';
    message: string;
    details?: any;
  }> {
    try {
      switch (modelConfig.type) {
        case 'teachable-machine':
          return await this.testTeachableMachineModel(modelConfig);
        
        case 'huggingface':
          return await this.testHuggingFaceModel(modelConfig);
        
        case 'custom':
          return await this.testCustomModel(modelConfig);
        
        default:
          throw new ValidationError('Unsupported model type');
      }
    } catch (error) {
      loggers.external.error('ai-model', '/test', error as Error);
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Model test failed',
        details: error,
      };
    }
  }

  /**
   * Get supported model types and their configurations
   */
  getSupportedModelTypes(): Array<{
    type: string;
    name: string;
    description: string;
    configSchema: Record<string, any>;
    examples: any[];
  }> {
    return [
      {
        type: 'teachable-machine',
        name: 'Teachable Machine',
        description: 'Google\'s Teachable Machine models for image, audio, and pose classification',
        configSchema: {
          modelUrl: {
            type: 'string',
            format: 'url',
            description: 'Base URL of the Teachable Machine model',
            required: true,
          },
          modelId: {
            type: 'string',
            description: 'Unique identifier for the model',
            required: true,
          },
          configuration: {
            type: 'object',
            properties: {
              classes: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of class labels',
              },
              imageSize: {
                type: 'number',
                description: 'Input image size (for image models)',
              },
              type: {
                type: 'string',
                enum: ['image', 'audio', 'pose'],
                description: 'Type of Teachable Machine model',
              },
            },
          },
        },
        examples: [
          {
            modelUrl: 'https://teachablemachine.withgoogle.com/models/example/',
            modelId: 'tm-image-model-1',
            configuration: {
              classes: ['Cat', 'Dog', 'Bird'],
              imageSize: 224,
              type: 'image',
            },
          },
        ],
      },
      {
        type: 'huggingface',
        name: 'Hugging Face',
        description: 'Pre-trained models from Hugging Face Hub',
        configSchema: {
          modelUrl: {
            type: 'string',
            format: 'url',
            description: 'Hugging Face model API URL',
            required: true,
          },
          modelId: {
            type: 'string',
            description: 'Hugging Face model identifier',
            required: true,
          },
          configuration: {
            type: 'object',
            properties: {
              task: {
                type: 'string',
                description: 'ML task type (e.g., text-classification, image-classification)',
              },
              pipeline: {
                type: 'string',
                description: 'Pipeline type for the model',
              },
              tokenRequired: {
                type: 'boolean',
                description: 'Whether API token is required',
              },
            },
          },
        },
        examples: [
          {
            modelUrl: 'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
            modelId: 'distilbert-base-uncased-finetuned-sst-2-english',
            configuration: {
              task: 'text-classification',
              pipeline: 'sentiment-analysis',
              tokenRequired: false,
            },
          },
        ],
      },
      {
        type: 'custom',
        name: 'Custom API',
        description: 'Custom AI model API endpoints',
        configSchema: {
          modelUrl: {
            type: 'string',
            format: 'url',
            description: 'Custom model API endpoint',
            required: true,
          },
          modelId: {
            type: 'string',
            description: 'Custom model identifier',
            required: true,
          },
          configuration: {
            type: 'object',
            properties: {
              method: {
                type: 'string',
                enum: ['GET', 'POST'],
                description: 'HTTP method for API calls',
              },
              headers: {
                type: 'object',
                description: 'Custom headers for API requests',
              },
              inputFormat: {
                type: 'string',
                description: 'Expected input format',
              },
              outputFormat: {
                type: 'string',
                description: 'Expected output format',
              },
            },
          },
        },
        examples: [
          {
            modelUrl: 'https://api.example.com/v1/predict',
            modelId: 'custom-classifier-v1',
            configuration: {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_API_KEY',
              },
              inputFormat: 'base64_image',
              outputFormat: 'json_predictions',
            },
          },
        ],
      },
    ];
  }

  /**
   * Private helper methods
   */
  private async validateModelConfig(config: AIModelConfig): Promise<void> {
    // Basic validation
    if (!config.modelUrl || !config.modelId) {
      throw new ValidationError('Model URL and ID are required');
    }

    // Validate URL format
    try {
      new URL(config.modelUrl);
    } catch {
      throw new ValidationError('Invalid model URL format');
    }

    // Type-specific validation
    switch (config.type) {
      case 'teachable-machine':
        await this.validateTeachableMachineConfig(config);
        break;
      
      case 'huggingface':
        await this.validateHuggingFaceConfig(config);
        break;
      
      case 'custom':
        await this.validateCustomConfig(config);
        break;
      
      default:
        throw new ValidationError('Unsupported model type');
    }
  }

  private async validateTeachableMachineConfig(config: AIModelConfig): Promise<void> {
    // Check if URL follows Teachable Machine pattern
    if (!config.modelUrl.includes('teachablemachine.withgoogle.com')) {
      throw new ValidationError('Invalid Teachable Machine URL');
    }

    // Validate configuration
    const { classes, imageSize, type } = config.configuration;
    
    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      throw new ValidationError('Classes array is required for Teachable Machine models');
    }

    if (type === 'image' && (!imageSize || imageSize <= 0)) {
      throw new ValidationError('Image size is required for image models');
    }
  }

  private async validateHuggingFaceConfig(config: AIModelConfig): Promise<void> {
    // Check if URL follows Hugging Face pattern
    if (!config.modelUrl.includes('huggingface.co')) {
      throw new ValidationError('Invalid Hugging Face URL');
    }

    // Validate configuration
    const { task, pipeline } = config.configuration;
    
    if (!task) {
      throw new ValidationError('Task type is required for Hugging Face models');
    }
  }

  private async validateCustomConfig(config: AIModelConfig): Promise<void> {
    const { method, inputFormat, outputFormat } = config.configuration;
    
    if (method && !['GET', 'POST'].includes(method)) {
      throw new ValidationError('Invalid HTTP method for custom model');
    }
  }

  private async testTeachableMachineModel(config: AIModelConfig): Promise<{
    status: 'success' | 'error';
    message: string;
    details?: any;
  }> {
    try {
      // Test metadata URL
      const metadataUrl = `${config.modelUrl}/metadata.json`;
      const response = await axios.get(metadataUrl, { timeout: 10000 });
      
      const metadata = response.data;
      
      return {
        status: 'success',
        message: 'Teachable Machine model is accessible',
        details: {
          classes: metadata.labels || [],
          modelType: metadata.modelType || 'unknown',
          version: metadata.version || 'unknown',
        },
      };
    } catch (error: any) {
      throw new ExternalServiceError('teachable-machine', `Model test failed: ${error.message}`);
    }
  }

  private async testHuggingFaceModel(config: AIModelConfig): Promise<{
    status: 'success' | 'error';
    message: string;
    details?: any;
  }> {
    try {
      // Test with a simple request
      const response = await axios.post(
        config.modelUrl,
        { inputs: 'test input' },
        { 
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return {
        status: 'success',
        message: 'Hugging Face model is accessible',
        details: {
          modelId: config.modelId,
          task: config.configuration.task,
          responseStatus: response.status,
        },
      };
    } catch (error: any) {
      // Some models might return 400 for test input, which is still a valid response
      if (error.response?.status === 400) {
        return {
          status: 'success',
          message: 'Hugging Face model is accessible (test input rejected as expected)',
          details: {
            modelId: config.modelId,
            task: config.configuration.task,
          },
        };
      }
      
      throw new ExternalServiceError('huggingface', `Model test failed: ${error.message}`);
    }
  }

  private async testCustomModel(config: AIModelConfig): Promise<{
    status: 'success' | 'error';
    message: string;
    details?: any;
  }> {
    try {
      const method = config.configuration.method || 'POST';
      const headers = config.configuration.headers || {};
      
      const response = await axios({
        method,
        url: config.modelUrl,
        headers,
        data: method === 'POST' ? { test: true } : undefined,
        timeout: 10000,
      });
      
      return {
        status: 'success',
        message: 'Custom model endpoint is accessible',
        details: {
          modelId: config.modelId,
          responseStatus: response.status,
          method,
        },
      };
    } catch (error: any) {
      throw new ExternalServiceError('custom', `Model test failed: ${error.message}`);
    }
  }
}
