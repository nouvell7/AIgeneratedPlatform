import axios, { AxiosInstance } from 'axios';
import { ExternalServiceError } from '../utils/errors';
import { loggers, logger } from '../utils/logger';

export interface CreateCloudflarePagesProjectResponse {
  id: string;
  name: string;
  domains: string[];
  // ... other relevant fields from Cloudflare Pages API
}

export class CloudflareClient {
  private client: AxiosInstance;
  private static instance: CloudflareClient;
  private accountId: string;

  private constructor() {
    const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
    const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!cloudflareApiToken || !cloudflareAccountId) {
      logger.error('CloudflareClient: CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID is not set in environment variables');
      throw new Error('Cloudflare API credentials are not configured.');
    }

    this.accountId = cloudflareAccountId;

    this.client = axios.create({
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/pages/projects`,
      headers: {
        'Authorization': `Bearer ${cloudflareApiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds timeout
    });

    this.setupInterceptors();
  }

  public static getInstance(): CloudflareClient {
    if (!CloudflareClient.instance) {
      CloudflareClient.instance = new CloudflareClient();
    }
    return CloudflareClient.instance;
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        loggers.external.error('Cloudflare Pages', error.config?.url || 'unknown', error);
        throw new ExternalServiceError('Cloudflare Pages', error.message);
      }
    );
  }

  // TODO: Implement Cloudflare Pages API methods here (e.g., createProject, deploy)
  public async createPagesProject(projectName: string, gitRepository: { provider: string; owner: string; name: string }): Promise<CreateCloudflarePagesProjectResponse> {
    try {
      const response = await this.client.post('/', {
        name: projectName,
        production_branch: 'main', // Assuming main branch for production
        source: {
          type: 'github', // Assuming GitHub for now
          config: {
            owner: gitRepository.owner,
            repo_name: gitRepository.name,
            pr_comments_enabled: true,
            deploy_hooks: {
              // TODO: Define deploy hooks if necessary
            },
          },
        },
      });
      logger.info(`CloudflareClient: Created Pages project ${response.data.result.id}`);
      return response.data.result;
    } catch (error) {
      loggers.external.error('Cloudflare Pages', `/pages/projects (createPagesProject)`, error as Error);
      throw new ExternalServiceError('Cloudflare Pages', `Failed to create Pages project: ${(error as Error).message}`);
    }
  }

  public async deployPagesProject(projectId: string): Promise<any> {
    try {
      // Cloudflare Pages deployment is typically triggered by pushing to the Git repository.
      // This method might be used to trigger a rebuild or get deployment status.
      // For now, it's a placeholder.
      logger.debug(`CloudflareClient: Triggering deployment for project ${projectId}`);
      // Assuming a simple POST to trigger a deploy, might be more complex
      const response = await this.client.post(`/${projectId}/deployments`, {});
      return response.data.result;
    } catch (error) {
      loggers.external.error('Cloudflare Pages', `/${projectId}/deployments (deployPagesProject)`, error as Error);
      throw new ExternalServiceError('Cloudflare Pages', `Failed to deploy Pages project: ${(error as Error).message}`);
    }
  }

  public async getPagesProjectDeployment(projectName: string, deploymentId: string): Promise<any> {
    try {
      const response = await this.client.get(`/${projectName}/deployments/${deploymentId}`);
      logger.info(`CloudflareClient: Retrieved deployment status for project ${projectName}, deployment ${deploymentId}`);
      return response.data.result;
    } catch (error) {
      loggers.external.error('Cloudflare Pages', `/${projectName}/deployments/${deploymentId} (getPagesProjectDeployment)`, error as Error);
      throw new ExternalServiceError('Cloudflare Pages', `Failed to retrieve Pages project deployment: ${(error as Error).message}`);
    }
  }

  public async getPagesProjectDeploymentLogs(projectName: string, deploymentId: string): Promise<any> {
    try {
      const response = await this.client.get(`/${projectName}/deployments/${deploymentId}/logs`);
      logger.info(`CloudflareClient: Retrieved deployment logs for project ${projectName}, deployment ${deploymentId}`);
      return response.data.result;
    } catch (error) {
      loggers.external.error('Cloudflare Pages', `/${projectName}/deployments/${deploymentId}/logs (getPagesProjectDeploymentLogs)`, error as Error);
      throw new ExternalServiceError('Cloudflare Pages', `Failed to retrieve Pages project deployment logs: ${(error as Error).message}`);
    }
  }

  public async rollbackPagesProject(projectId: string): Promise<any> {
    try {
      // Cloudflare Pages does not have a direct "rollback" API.
      // Rollback usually means deploying a previous successful deployment.
      // This is a placeholder for potential future implementation if Cloudflare introduces direct rollback.
      // For now, it will simply return a success message.
      logger.info(`CloudflareClient: Attempted rollback for project ${projectId}. Cloudflare Pages does not support direct rollback via API.`);
      return { success: true, message: `Rollback initiated for project ${projectId}. Note: Cloudflare Pages does not support direct API rollback. This is a conceptual trigger.` };
    } catch (error) {
      loggers.external.error('Cloudflare Pages', `/pages/projects/${projectId}/rollback (rollbackPagesProject)`, error as Error);
      throw new ExternalServiceError('Cloudflare Pages', `Failed to rollback Pages project: ${(error as Error).message}`);
    }
  }
}

export const cloudflareClient = CloudflareClient.getInstance();
