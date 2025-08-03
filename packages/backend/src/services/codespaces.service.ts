import { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export interface CodespaceConfig {
  repositoryName: string;
  branch?: string;
  machine?: string;
  devcontainerPath?: string;
  idleTimeoutMinutes?: number;
}

export interface CodespaceInfo {
  id: number;
  name: string;
  displayName: string;
  environmentId: string;
  owner: {
    login: string;
    id: number;
  };
  billableOwner: {
    login: string;
    id: number;
  };
  repository: {
    id: number;
    name: string;
    fullName: string;
  };
  machine: {
    name: string;
    displayName: string;
    operatingSystem: string;
    storageInBytes: number;
    memoryInBytes: number;
    cpus: number;
  };
  devcontainerPath?: string;
  prebuild: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
  state: 'Unknown' | 'Created' | 'Queued' | 'Provisioning' | 'Available' | 'Awaiting' | 'Unavailable' | 'Deleted' | 'Moved' | 'Shutdown' | 'Archived' | 'Starting' | 'ShuttingDown' | 'Failed' | 'Exporting' | 'Updating' | 'Rebuilding';
  url: string;
  gitStatus: {
    ahead?: number;
    behind?: number;
    hasUnpushedChanges?: boolean;
    hasUncommittedChanges?: boolean;
    ref?: string;
  };
  location: 'EastUs' | 'SouthEastAsia' | 'WestEurope' | 'WestUs2';
  idleTimeoutMinutes?: number;
  webUrl: string;
  machinesUrl: string;
  startUrl: string;
  stopUrl: string;
  publishUrl?: string;
  pullsUrl: string;
  recentFolders: string[];
}

class CodespacesService {
  private octokit: Octokit;

  constructor() {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new AppError('GitHub token is required for Codespaces integration', 500);
    }

    this.octokit = new Octokit({
      auth: githubToken,
    });
  }

  /**
   * Create a new codespace for a repository
   */
  async createCodespace(
    owner: string,
    repo: string,
    config: CodespaceConfig
  ): Promise<CodespaceInfo> {
    try {
      logger.info('Creating codespace', { owner, repo, config });

      const response = await this.octokit.rest.codespaces.createForRepo({
        owner,
        repo,
        ref: config.branch || 'main',
        machine: config.machine || 'basicLinux32gb',
        devcontainer_path: config.devcontainerPath,
        idle_timeout_minutes: config.idleTimeoutMinutes || 30,
      });

      logger.info('Codespace created successfully', { 
        codespaceId: response.data.id,
        name: response.data.name 
      });

      return response.data as CodespaceInfo;
    } catch (error: any) {
      logger.error('Failed to create codespace', { 
        error: error.message,
        owner,
        repo,
        config 
      });
      throw new AppError(`Failed to create codespace: ${error.message}`, 500);
    }
  }

  /**
   * Get codespace information
   */
  async getCodespace(codespaceId: string): Promise<CodespaceInfo> {
    try {
      const response = await this.octokit.rest.codespaces.get({
        codespace_name: codespaceId,
      });

      return response.data as CodespaceInfo;
    } catch (error: any) {
      logger.error('Failed to get codespace', { 
        error: error.message,
        codespaceId 
      });
      throw new AppError(`Failed to get codespace: ${error.message}`, 500);
    }
  }

  /**
   * List codespaces for a user
   */
  async listCodespaces(repositoryId?: number): Promise<CodespaceInfo[]> {
    try {
      const response = await this.octokit.rest.codespaces.listForAuthenticatedUser({
        repository_id: repositoryId,
      });

      return response.data.codespaces as CodespaceInfo[];
    } catch (error: any) {
      logger.error('Failed to list codespaces', { 
        error: error.message,
        repositoryId 
      });
      throw new AppError(`Failed to list codespaces: ${error.message}`, 500);
    }
  }

  /**
   * Start a codespace
   */
  async startCodespace(codespaceId: string): Promise<CodespaceInfo> {
    try {
      logger.info('Starting codespace', { codespaceId });

      const response = await this.octokit.rest.codespaces.start({
        codespace_name: codespaceId,
      });

      logger.info('Codespace started successfully', { codespaceId });

      return response.data as CodespaceInfo;
    } catch (error: any) {
      logger.error('Failed to start codespace', { 
        error: error.message,
        codespaceId 
      });
      throw new AppError(`Failed to start codespace: ${error.message}`, 500);
    }
  }

  /**
   * Stop a codespace
   */
  async stopCodespace(codespaceId: string): Promise<CodespaceInfo> {
    try {
      logger.info('Stopping codespace', { codespaceId });

      const response = await this.octokit.rest.codespaces.stop({
        codespace_name: codespaceId,
      });

      logger.info('Codespace stopped successfully', { codespaceId });

      return response.data as CodespaceInfo;
    } catch (error: any) {
      logger.error('Failed to stop codespace', { 
        error: error.message,
        codespaceId 
      });
      throw new AppError(`Failed to stop codespace: ${error.message}`, 500);
    }
  }

  /**
   * Delete a codespace
   */
  async deleteCodespace(codespaceId: string): Promise<void> {
    try {
      logger.info('Deleting codespace', { codespaceId });

      await this.octokit.rest.codespaces.delete({
        codespace_name: codespaceId,
      });

      logger.info('Codespace deleted successfully', { codespaceId });
    } catch (error: any) {
      logger.error('Failed to delete codespace', { 
        error: error.message,
        codespaceId 
      });
      throw new AppError(`Failed to delete codespace: ${error.message}`, 500);
    }
  }

  /**
   * Create a repository with AI service template
   */
  async createRepositoryWithTemplate(
    owner: string,
    repoName: string,
    description: string,
    aiModelConfig: any
  ): Promise<{ repository: any; codespace: CodespaceInfo }> {
    try {
      logger.info('Creating repository with AI template', { 
        owner, 
        repoName, 
        description 
      });

      // Create repository
      const repoResponse = await this.octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description,
        private: false,
        auto_init: true,
      });

      const repository = repoResponse.data;

      // Generate AI service code template
      const templateFiles = this.generateAIServiceTemplate(aiModelConfig);

      // Create files in repository
      for (const file of templateFiles) {
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: repository.owner.login,
          repo: repository.name,
          path: file.path,
          message: `Add ${file.path}`,
          content: Buffer.from(file.content).toString('base64'),
        });
      }

      // Create codespace
      const codespace = await this.createCodespace(
        repository.owner.login,
        repository.name,
        {
          repositoryName: repository.name,
          branch: 'main',
          machine: 'basicLinux32gb',
          idleTimeoutMinutes: 60,
        }
      );

      logger.info('Repository and codespace created successfully', {
        repositoryId: repository.id,
        codespaceId: codespace.id,
      });

      return { repository, codespace };
    } catch (error: any) {
      logger.error('Failed to create repository with template', { 
        error: error.message,
        owner,
        repoName 
      });
      throw new AppError(`Failed to create repository with template: ${error.message}`, 500);
    }
  }

  /**
   * Generate AI service template files
   */
  private generateAIServiceTemplate(aiModelConfig: any): Array<{ path: string; content: string }> {
    const files = [];

    // Package.json
    files.push({
      path: 'package.json',
      content: JSON.stringify({
        name: 'ai-service',
        version: '1.0.0',
        description: 'AI Service generated by AI Platform',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'node index.js',
        },
        dependencies: {
          express: '^4.18.2',
          cors: '^2.8.5',
          '@tensorflow/tfjs-node': '^4.10.0',
        },
      }, null, 2),
    });

    // Main application file
    files.push({
      path: 'index.js',
      content: `const express = require('express');
const cors = require('cors');
const tf = require('@tensorflow/tfjs-node');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// AI Model configuration
const MODEL_URL = '${aiModelConfig.modelUrl || 'https://teachablemachine.withgoogle.com/models/your-model/'}';

let model;

// Load AI model
async function loadModel() {
  try {
    console.log('Loading AI model...');
    model = await tf.loadLayersModel(MODEL_URL);
    console.log('AI model loaded successfully');
  } catch (error) {
    console.error('Failed to load AI model:', error);
  }
}

// Prediction endpoint
app.post('/predict', async (req, res) => {
  try {
    if (!model) {
      return res.status(500).json({ error: 'Model not loaded' });
    }

    const { data } = req.body;
    
    // Process input data (this will vary based on your model type)
    const prediction = model.predict(tf.tensor(data));
    const result = await prediction.data();
    
    res.json({ 
      prediction: Array.from(result),
      confidence: Math.max(...result)
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    modelLoaded: !!model,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`AI Service running on port \${PORT}\`);
  loadModel();
});`,
    });

    // HTML frontend
    files.push({
      path: 'public/index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Service</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .upload-area {
            border: 2px dashed #ccc;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            cursor: pointer;
        }
        .upload-area:hover {
            border-color: #007bff;
            background-color: #f8f9fa;
        }
        .result {
            margin-top: 20px;
            padding: 20px;
            background-color: #e9ecef;
            border-radius: 5px;
        }
        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Service</h1>
        <p>Upload an image or provide data to get AI predictions.</p>
        
        <div class="upload-area" onclick="document.getElementById('fileInput').click()">
            <input type="file" id="fileInput" style="display: none;" accept="image/*">
            <p>Click here to upload an image</p>
        </div>
        
        <button onclick="predict()" id="predictBtn">Predict</button>
        
        <div id="result" class="result" style="display: none;">
            <h3>Prediction Result:</h3>
            <div id="predictionText"></div>
        </div>
    </div>

    <script>
        let selectedFile = null;

        document.getElementById('fileInput').addEventListener('change', function(e) {
            selectedFile = e.target.files[0];
            if (selectedFile) {
                document.querySelector('.upload-area p').textContent = \`Selected: \${selectedFile.name}\`;
            }
        });

        async function predict() {
            if (!selectedFile) {
                alert('Please select a file first');
                return;
            }

            const predictBtn = document.getElementById('predictBtn');
            predictBtn.disabled = true;
            predictBtn.textContent = 'Predicting...';

            try {
                // This is a simplified example - you'll need to process the image
                // according to your specific AI model requirements
                const formData = new FormData();
                formData.append('image', selectedFile);

                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        data: [1, 2, 3, 4] // Placeholder data - replace with actual image processing
                    })
                });

                const result = await response.json();
                
                document.getElementById('result').style.display = 'block';
                document.getElementById('predictionText').innerHTML = \`
                    <p><strong>Prediction:</strong> \${result.prediction}</p>
                    <p><strong>Confidence:</strong> \${(result.confidence * 100).toFixed(2)}%</p>
                \`;
            } catch (error) {
                console.error('Prediction failed:', error);
                alert('Prediction failed. Please try again.');
            } finally {
                predictBtn.disabled = false;
                predictBtn.textContent = 'Predict';
            }
        }
    </script>
</body>
</html>`,
    });

    // README
    files.push({
      path: 'README.md',
      content: `# AI Service

This is an AI service generated by the AI Platform.

## Features

- AI model integration with Teachable Machine
- REST API for predictions
- Web interface for testing
- Easy deployment to cloud platforms

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

3. Open your browser and go to \`http://localhost:3000\`

## API Endpoints

- \`GET /health\` - Health check
- \`POST /predict\` - Make predictions

## Configuration

Update the \`MODEL_URL\` in \`index.js\` with your Teachable Machine model URL.

## Deployment

This service can be deployed to various platforms:
- Cloudflare Pages
- Vercel
- Netlify
- Heroku

## Support

For support, please visit the AI Platform community.`,
    });

    // .gitignore
    files.push({
      path: '.gitignore',
      content: `node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.DS_Store
*.log`,
    });

    return files;
  }

  /**
   * Get available machine types for codespaces
   */
  async getAvailableMachines(owner: string, repo: string): Promise<any[]> {
    try {
      const response = await this.octokit.rest.codespaces.listAvailableSecretsForRepo({
        owner,
        repo,
      });

      // This is a placeholder - GitHub API doesn't have a direct endpoint for machine types
      // In practice, you would need to use the documented machine types
      return [
        { name: 'basicLinux32gb', displayName: 'Basic (4 cores, 8 GB RAM, 32 GB storage)' },
        { name: 'standardLinux32gb', displayName: 'Standard (8 cores, 16 GB RAM, 32 GB storage)' },
        { name: 'premiumLinux32gb', displayName: 'Premium (16 cores, 32 GB RAM, 32 GB storage)' },
      ];
    } catch (error: any) {
      logger.error('Failed to get available machines', { 
        error: error.message,
        owner,
        repo 
      });
      throw new AppError(`Failed to get available machines: ${error.message}`, 500);
    }
  }
}

export const codespacesService = new CodespacesService();