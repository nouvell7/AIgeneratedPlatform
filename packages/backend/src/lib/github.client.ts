import axios, { AxiosInstance } from 'axios';
import { ExternalServiceError } from '../utils/errors';
import { loggers, logger } from '../utils/logger';

export interface CreateRepositoryResponse {
  id: number;
  name: string;
  html_url: string; // URL to the repository
  default_branch: string;
  owner: {
    login: string;
  };
  // ... other relevant fields from GitHub API
}

export class GitHubClient {
  private client: AxiosInstance;
  private static instance: GitHubClient;
  private username: string;

  private constructor() {
    const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
    const githubUsername = process.env.GITHUB_USERNAME;

    if (!githubAccessToken || !githubUsername) {
      logger.error('GitHubClient: GITHUB_ACCESS_TOKEN or GITHUB_USERNAME is not set in environment variables');
      throw new Error('GitHub API credentials are not configured.');
    }

    this.username = githubUsername;

    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${githubAccessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json', // GitHub API version
      },
      timeout: 60000, // 60 seconds timeout
    });

    this.setupInterceptors();
  }

  public static getInstance(): GitHubClient {
    if (!GitHubClient.instance) {
      GitHubClient.instance = new GitHubClient();
    }
    return GitHubClient.instance;
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        loggers.external.error('GitHub', error.config?.url || 'unknown', error);
        throw new ExternalServiceError('GitHub', error.message);
      }
    );
  }

  /**
   * Creates a new GitHub repository.
   * @param repoName The name of the new repository.
   * @param description The description of the repository.
   * @param privateRepo Whether the repository should be private.
   * @returns Details of the created repository.
   */
  public async createRepository(repoName: string, description: string = '', privateRepo: boolean = false): Promise<CreateRepositoryResponse> {
    try {
      const response = await this.client.post('/user/repos', {
        name: repoName,
        description: description,
        private: privateRepo,
        auto_init: true, // Initialize with a README
      });
      logger.info(`GitHubClient: Created repository ${response.data.full_name}`);
      return response.data;
    } catch (error) {
      loggers.external.error('GitHub', `/user/repos (createRepository)`, error as Error);
      throw new ExternalServiceError('GitHub', `Failed to create repository: ${(error as Error).message}`);
    }
  }

  /**
   * Creates a file in a GitHub repository.
   * @param owner The owner of the repository.
   * @param repo The name of the repository.
   * @param path The path to the file.
   * @param content The content of the file.
   * @param message The commit message.
   * @returns void
   */
  public async createFile(owner: string, repo: string, path: string, content: string, message: string): Promise<void> {
    try {
      // GitHub API requires content to be base64 encoded
      const base64Content = Buffer.from(content).toString('base64');

      await this.client.put(`/repos/${owner}/${repo}/contents/${path}`, {
        message: message,
        content: base64Content,
      });
      logger.info(`GitHubClient: Created file ${path} in ${owner}/${repo}`);
    } catch (error) {
      loggers.external.error('GitHub', `/repos/${owner}/${repo}/contents/${path} (createFile)`, error as Error);
      throw new ExternalServiceError('GitHub', `Failed to create file ${path}: ${(error as Error).message}`);
    }
  }

  /**
   * Updates a file in a GitHub repository.
   * @param owner The owner of the repository.
   * @param repo The name of the repository.
   * @param path The path to the file.
   * @param content The new content of the file.
   * @param message The commit message.
   * @returns void
   */
  public async updateFile(owner: string, repo: string, path: string, content: string, message: string): Promise<void> {
    try {
      // First, get the current file to get its SHA
      const { data } = await this.client.get(`/repos/${owner}/${repo}/contents/${path}`);
      const currentSha = data.sha;

      const base64Content = Buffer.from(content).toString('base64');

      await this.client.put(`/repos/${owner}/${repo}/contents/${path}`, {
        message: message,
        content: base64Content,
        sha: currentSha,
      });
      logger.info(`GitHubClient: Updated file ${path} in ${owner}/${repo}`);
    } catch (error) {
      loggers.external.error('GitHub', `/repos/${owner}/${repo}/contents/${path} (updateFile)`, error as Error);
      throw new ExternalServiceError('GitHub', `Failed to update file ${path}: ${(error as Error).message}`);
    }
  }
}

export const githubClient = GitHubClient.getInstance();
