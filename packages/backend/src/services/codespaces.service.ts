import { injectable } from 'tsyringe';
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

export type CodespaceInfo = any;

@injectable()
export class CodespacesService {
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
    repositoryId: number,
    config: CodespaceConfig
  ): Promise<CodespaceInfo> {
    try {
      logger.info('Creating codespace', { repositoryId, config });

      const response = await this.octokit.rest.codespaces.createForAuthenticatedUser({
        repository_id: repositoryId,
        ref: config.branch || 'main',
        machine: config.machine || 'basicLinux32gb',
        devcontainer_path: config.devcontainerPath,
        idle_timeout_minutes: config.idleTimeoutMinutes || 30,
      } as any);

      logger.info('Codespace created successfully', { 
        codespaceId: response.data.id,
        name: response.data.name 
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to create codespace', { 
        error: error.message,
        repositoryId,
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
      const response = await this.octokit.rest.codespaces.getForAuthenticatedUser({
        codespace_name: codespaceId,
      });

      return response.data;
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

      return response.data.codespaces;
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
      const response = await this.octokit.rest.codespaces.startForAuthenticatedUser({
        codespace_name: codespaceId,
      });

      return response.data;
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
      const response = await this.octokit.rest.codespaces.stopForAuthenticatedUser({
        codespace_name: codespaceId,
      });

      return response.data;
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
      await this.octokit.rest.codespaces.deleteForAuthenticatedUser({
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
   * Create repository with template and codespace
   */
  async createRepositoryWithTemplate(
    owner: string,
    repoName: string,
    description: string,
    aiModelConfig: any
  ): Promise<{
    repository: any;
    codespace: any;
  }> {
    try {
      // Create repository
      const repoResponse = await this.octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description,
        private: false,
        auto_init: true,
      });

      const repository = repoResponse.data;

      // Create codespace for the new repository
      const codespace = await this.createCodespace(repository.id, {
        repositoryName: repoName,
        branch: 'main',
      });

      return {
        repository,
        codespace,
      };
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
   * Get available machines for codespaces
   */
  async getAvailableMachines(repositoryId: number): Promise<any[]> {
    try {
      // GitHub API에서 사용 가능한 머신 목록을 가져오는 대신 기본 머신 목록 반환
      const defaultMachines = [
        { name: 'basicLinux32gb', display_name: 'Basic Linux (32 GB)', prebuild_availability: 'ready' },
        { name: 'standardLinux32gb', display_name: 'Standard Linux (32 GB)', prebuild_availability: 'ready' },
        { name: 'premiumLinux', display_name: 'Premium Linux', prebuild_availability: 'ready' }
      ];

      return defaultMachines;
    } catch (error: any) {
      logger.error('Failed to get available machines', { 
        error: error.message,
        repositoryId 
      });
      throw new AppError(`Failed to get available machines: ${error.message}`, 500);
    }
  }
}