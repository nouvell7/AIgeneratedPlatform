import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { AIModelService } from '../services/aiModel.service';
import { validateRequest, commonSchemas } from '../lib/validation';
import { aiModelSchema as aiModelConfigSchema } from '@shared/schemas';
import { z } from 'zod';

@injectable()
export class AIModelController {
  constructor(@inject(AIModelService) private aiModelService: AIModelService) {}

  /**
   * Connect AI model to project
   * POST /projects/:id/ai-model
   */
  connectModel = [
    validateRequest({
      params: commonSchemas.idParam,
      body: aiModelConfigSchema,
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id: projectId } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        await this.aiModelService.connectModel(projectId, userId, req.body);

        res.json({
          success: true,
          message: 'AI model connected successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Disconnect AI model from project
   * DELETE /projects/:id/ai-model
   */
  disconnectModel = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id: projectId } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
            },
          });
        }

        await this.aiModelService.disconnectModel(projectId, userId);

        res.json({
          success: true,
          message: 'AI model disconnected successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get project's AI model configuration
   * GET /projects/:id/ai-model
   */
  getModelConfig = [
    validateRequest({ params: commonSchemas.idParam }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id: projectId } = req.params;
        const userId = req.user?.userId;

        const modelConfig = await this.aiModelService.getModelConfig(projectId, userId);

        res.json({
          success: true,
          data: { modelConfig },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Test AI model connection
   * POST /ai-models/test
   */
  testModel = [
    validateRequest({ body: aiModelConfigSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await this.aiModelService.testModel(req.body);

        res.json({
          success: result.status === 'success',
          data: result,
          message: result.message,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get supported model types
   * GET /ai-models/types
   */
  getSupportedTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const types = this.aiModelService.getSupportedModelTypes();

      res.json({
        success: true,
        data: { types },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get model type configuration schema
   * GET /ai-models/types/:type/schema
   */
  getTypeSchema = [
    validateRequest({
      params: z.object({
        type: z.enum(['teachable-machine', 'huggingface', 'custom']),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { type } = req.params;
        const types = this.aiModelService.getSupportedModelTypes();
        const typeInfo = types.find(t => t.type === type);

        if (!typeInfo) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Model type not found',
            },
          });
        }

        res.json({
          success: true,
          data: {
            type: typeInfo.type,
            name: typeInfo.name,
            description: typeInfo.description,
            schema: typeInfo.configSchema,
            examples: typeInfo.examples,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Validate model configuration
   * POST /ai-models/validate
   */
  validateConfig = [
    validateRequest({ body: aiModelConfigSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // The validation happens in the middleware
        // If we reach here, the configuration is valid
        res.json({
          success: true,
          message: 'Model configuration is valid',
          data: {
            config: req.body,
            validated: true,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get model integration guide
   * GET /ai-models/guide/:type
   */
  getIntegrationGuide = [
    validateRequest({
      params: z.object({
        type: z.enum(['teachable-machine', 'huggingface', 'custom']),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { type } = req.params;

        const guides = {
          'teachable-machine': {
            title: 'Teachable Machine Integration Guide',
            steps: [
              {
                step: 1,
                title: 'Train Your Model',
                description: 'Go to teachablemachine.withgoogle.com and train your model',
                details: [
                  'Choose your project type (Image, Audio, or Pose)',
                  'Upload and label your training data',
                  'Train the model using the web interface',
                  'Test your model to ensure it works correctly',
                ],
              },
              {
                step: 2,
                title: 'Export Your Model',
                description: 'Export your trained model for web use',
                details: [
                  'Click "Export Model" button',
                  'Select "TensorFlow.js" format',
                  'Choose "Upload (shareable link)" option',
                  'Copy the provided model URL',
                ],
              },
              {
                step: 3,
                title: 'Configure in Platform',
                description: 'Add your model to your project',
                details: [
                  'Paste the model URL in the configuration',
                  'Provide a unique model ID',
                  'List all class labels from your training',
                  'Set the correct image size (usually 224)',
                ],
              },
            ],
            codeExample: `
// Example JavaScript integration
import * as tmImage from '@teachablemachine/image';

const modelURL = 'YOUR_MODEL_URL/model.json';
const metadataURL = 'YOUR_MODEL_URL/metadata.json';

const model = await tmImage.load(modelURL, metadataURL);
const prediction = await model.predict(imageElement);
            `,
          },
          'huggingface': {
            title: 'Hugging Face Integration Guide',
            steps: [
              {
                step: 1,
                title: 'Choose a Model',
                description: 'Browse and select a model from Hugging Face Hub',
                details: [
                  'Visit huggingface.co/models',
                  'Filter by task type (text-classification, image-classification, etc.)',
                  'Check model documentation and examples',
                  'Note the model ID (e.g., "distilbert-base-uncased")',
                ],
              },
              {
                step: 2,
                title: 'Get API Access',
                description: 'Set up API access for the model',
                details: [
                  'Some models are free to use via Inference API',
                  'Create a Hugging Face account if needed',
                  'Generate an API token for private models',
                  'Check rate limits and usage policies',
                ],
              },
              {
                step: 3,
                title: 'Configure Integration',
                description: 'Add the model to your project',
                details: [
                  'Use the Inference API URL format',
                  'Specify the correct task type',
                  'Add authentication if required',
                  'Test with sample inputs',
                ],
              },
            ],
            codeExample: `
// Example API call
const response = await fetch(
  'https://api-inference.huggingface.co/models/MODEL_ID',
  {
    headers: { Authorization: 'Bearer YOUR_TOKEN' },
    method: 'POST',
    body: JSON.stringify({ inputs: 'Your input text' }),
  }
);
const result = await response.json();
            `,
          },
          'custom': {
            title: 'Custom API Integration Guide',
            steps: [
              {
                step: 1,
                title: 'Prepare Your API',
                description: 'Ensure your custom API is ready for integration',
                details: [
                  'API should accept HTTP requests (GET or POST)',
                  'Implement proper error handling and status codes',
                  'Add CORS headers if needed for web access',
                  'Document input and output formats',
                ],
              },
              {
                step: 2,
                title: 'Authentication Setup',
                description: 'Configure authentication if required',
                details: [
                  'Set up API keys or tokens',
                  'Configure proper headers',
                  'Test authentication flow',
                  'Ensure secure transmission (HTTPS)',
                ],
              },
              {
                step: 3,
                title: 'Integration Configuration',
                description: 'Add your custom API to the project',
                details: [
                  'Provide the complete API endpoint URL',
                  'Specify HTTP method (GET/POST)',
                  'Configure custom headers',
                  'Define input/output formats',
                ],
              },
            ],
            codeExample: `
// Example custom API call
const response = await fetch('YOUR_API_ENDPOINT', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    input: 'your input data',
    format: 'json'
  }),
});
const result = await response.json();
            `,
          },
        };

        const guide = guides[type as keyof typeof guides];
        if (!guide) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Integration guide not found',
            },
          });
        }

        res.json({
          success: true,
          data: { guide },
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}
