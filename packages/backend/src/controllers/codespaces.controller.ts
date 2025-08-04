import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { CodespacesService, CodespaceConfig } from '../services/codespaces.service'; // Corrected import to class
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

@injectable()
export class CodespacesController {
  constructor(@inject(CodespacesService) private codespacesService: CodespacesService) {}

  /**
   * Create a new codespace
   */
  async createCodespace(req: Request, res: Response) {
    try {
      const { owner, repo, config } = req.body;

      if (!owner || !repo) {
        throw new AppError('Owner and repository name are required', 400);
      }

      // Repository ID를 가져와야 하지만, 임시로 1을 사용
      const repositoryId = 1; // TODO: 실제 repository ID를 가져오는 로직 필요
      const codespace = await this.codespacesService.createCodespace(repositoryId, config);

      res.status(201).json({
        success: true,
        data: { codespace },
      });
    } catch (error: any) {
      logger.error('Failed to create codespace', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'CODESPACE_CREATE_FAILED',
        },
      });
    }
  }

  /**
   * Get codespace information
   */
  async getCodespace(req: Request, res: Response) {
    try {
      const { codespaceId } = req.params;

      if (!codespaceId) {
        throw new AppError('Codespace ID is required', 400);
      }

      const codespace = await this.codespacesService.getCodespace(codespaceId);

      res.json({
        success: true,
        data: { codespace },
      });
    } catch (error: any) {
      logger.error('Failed to get codespace', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'CODESPACE_GET_FAILED',
        },
      });
    }
  }

  /**
   * List codespaces
   */
  async listCodespaces(req: Request, res: Response) {
    try {
      const { repositoryId } = req.query;

      const codespaces = await this.codespacesService.listCodespaces(
        repositoryId ? parseInt(repositoryId as string) : undefined
      );

      res.json({
        success: true,
        data: { codespaces },
      });
    } catch (error: any) {
      logger.error('Failed to list codespaces', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'CODESPACE_LIST_FAILED',
        },
      });
    }
  }

  /**
   * Start a codespace
   */
  async startCodespace(req: Request, res: Response) {
    try {
      const { codespaceId } = req.params;

      if (!codespaceId) {
        throw new AppError('Codespace ID is required', 400);
      }

      const codespace = await this.codespacesService.startCodespace(codespaceId);

      res.json({
        success: true,
        data: { codespace },
      });
    } catch (error: any) {
      logger.error('Failed to start codespace', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'CODESPACE_START_FAILED',
        },
      });
    }
  }

  /**
   * Stop a codespace
   */
  async stopCodespace(req: Request, res: Response) {
    try {
      const { codespaceId } = req.params;

      if (!codespaceId) {
        throw new AppError('Codespace ID is required', 400);
      }

      const codespace = await this.codespacesService.stopCodespace(codespaceId);

      res.json({
        success: true,
        data: { codespace },
      });
    } catch (error: any) {
      logger.error('Failed to stop codespace', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'CODESPACE_STOP_FAILED',
        },
      });
    }
  }

  /**
   * Delete a codespace
   */
  async deleteCodespace(req: Request, res: Response) {
    try {
      const { codespaceId } = req.params;

      if (!codespaceId) {
        throw new AppError('Codespace ID is required', 400);
      }

      await this.codespacesService.deleteCodespace(codespaceId);

      res.json({
        success: true,
        message: 'Codespace deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete codespace', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'CODESPACE_DELETE_FAILED',
        },
      });
    }
  }

  /**
   * Create repository with AI service template
   */
  async createRepositoryWithTemplate(req: Request, res: Response) {
    try {
      const { owner, repoName, description, aiModelConfig } = req.body;

      if (!owner || !repoName) {
        throw new AppError('Owner and repository name are required', 400);
      }

      const result = await this.codespacesService.createRepositoryWithTemplate(
        owner,
        repoName,
        description || 'AI Service generated by AI Platform',
        aiModelConfig || {}
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Failed to create repository with template', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'REPOSITORY_CREATE_FAILED',
        },
      });
    }
  }

  /**
   * Get available machine types
   */
  async getAvailableMachines(req: Request, res: Response) {
    try {
      const { owner, repo } = req.params;

      if (!owner || !repo) {
        throw new AppError('Owner and repository name are required', 400);
      }

      // Repository ID를 가져와야 하지만, 임시로 1을 사용
      const repositoryId = 1; // TODO: 실제 repository ID를 가져오는 로직 필요
      const machines = await this.codespacesService.getAvailableMachines(repositoryId);

      res.json({
        success: true,
        data: { machines },
      });
    } catch (error: any) {
      logger.error('Failed to get available machines', { error: error.message });
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          code: 'MACHINES_GET_FAILED',
        },
      });
    }
  }
}
