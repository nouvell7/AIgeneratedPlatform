import 'reflect-metadata';
import { CodespacesService, CodespaceConfig } from '../codespaces.service';
import { AppError } from '../../utils/errors';

// Mock dependencies
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const { Octokit } = require('@octokit/rest');

describe('CodespacesService', () => {
  let codespacesService: CodespacesService;
  let mockOctokit: any;

  beforeEach(() => {
    // Set environment variable
    process.env.GITHUB_TOKEN = 'test-github-token';
    
    // Create mock Octokit instance
    mockOctokit = {
      rest: {
        codespaces: {
          createForAuthenticatedUser: jest.fn(),
          getForAuthenticatedUser: jest.fn(),
          listForAuthenticatedUser: jest.fn(),
          startForAuthenticatedUser: jest.fn(),
          stopForAuthenticatedUser: jest.fn(),
          deleteForAuthenticatedUser: jest.fn(),
        },
        repos: {
          createForAuthenticatedUser: jest.fn(),
        },
      },
    };

    Octokit.mockImplementation(() => mockOctokit);
    
    codespacesService = new CodespacesService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN;
  });

  describe('constructor', () => {
    it('GitHub 토큰이 없으면 AppError 발생', () => {
      delete process.env.GITHUB_TOKEN;
      
      expect(() => new CodespacesService()).toThrow(AppError);
      expect(() => new CodespacesService()).toThrow('GitHub token is required for Codespaces integration');
    });

    it('GitHub 토큰이 있으면 Octokit 인스턴스 생성', () => {
      process.env.GITHUB_TOKEN = 'test-token';
      
      const service = new CodespacesService();
      
      expect(Octokit).toHaveBeenCalledWith({
        auth: 'test-token',
      });
    });
  });

  describe('createCodespace', () => {
    const repositoryId = 12345;
    const config: CodespaceConfig = {
      repositoryName: 'test-repo',
      branch: 'main',
      machine: 'basicLinux32gb',
      idleTimeoutMinutes: 30,
    };

    it('Codespace 생성 성공', async () => {
      // Given
      const mockCodespace = {
        id: 'codespace-123',
        name: 'test-codespace',
        state: 'Available',
        web_url: 'https://github.com/codespaces/test-codespace',
      };

      mockOctokit.rest.codespaces.createForAuthenticatedUser.mockResolvedValue({
        data: mockCodespace,
      } as any);

      // When
      const result = await codespacesService.createCodespace(repositoryId, config);

      // Then
      expect(result).toEqual(mockCodespace);
      expect(mockOctokit.rest.codespaces.createForAuthenticatedUser).toHaveBeenCalledWith({
        repository_id: repositoryId,
        ref: 'main',
        machine: 'basicLinux32gb',
        devcontainer_path: undefined,
        idle_timeout_minutes: 30,
      });
    });

    it('기본값으로 Codespace 생성', async () => {
      // Given
      const basicConfig: CodespaceConfig = {
        repositoryName: 'test-repo',
      };

      const mockCodespace = {
        id: 'codespace-123',
        name: 'test-codespace',
      };

      mockOctokit.rest.codespaces.createForAuthenticatedUser.mockResolvedValue({
        data: mockCodespace,
      } as any);

      // When
      await codespacesService.createCodespace(repositoryId, basicConfig);

      // Then
      expect(mockOctokit.rest.codespaces.createForAuthenticatedUser).toHaveBeenCalledWith({
        repository_id: repositoryId,
        ref: 'main',
        machine: 'basicLinux32gb',
        devcontainer_path: undefined,
        idle_timeout_minutes: 30,
      });
    });

    it('GitHub API 오류 시 AppError 발생', async () => {
      // Given
      const error = new Error('GitHub API Error');
      mockOctokit.rest.codespaces.createForAuthenticatedUser.mockRejectedValue(error);

      // When & Then
      await expect(codespacesService.createCodespace(repositoryId, config))
        .rejects.toThrow(AppError);
      await expect(codespacesService.createCodespace(repositoryId, config))
        .rejects.toThrow('Failed to create codespace: GitHub API Error');
    });
  });

  describe('getCodespace', () => {
    const codespaceId = 'test-codespace-id';

    it('Codespace 정보 조회 성공', async () => {
      // Given
      const mockCodespace = {
        id: codespaceId,
        name: 'test-codespace',
        state: 'Available',
        web_url: 'https://github.com/codespaces/test-codespace',
      };

      mockOctokit.rest.codespaces.getForAuthenticatedUser.mockResolvedValue({
        data: mockCodespace,
      } as any);

      // When
      const result = await codespacesService.getCodespace(codespaceId);

      // Then
      expect(result).toEqual(mockCodespace);
      expect(mockOctokit.rest.codespaces.getForAuthenticatedUser).toHaveBeenCalledWith({
        codespace_name: codespaceId,
      });
    });

    it('존재하지 않는 Codespace 조회 시 AppError 발생', async () => {
      // Given
      const error = new Error('Codespace not found');
      mockOctokit.rest.codespaces.getForAuthenticatedUser.mockRejectedValue(error);

      // When & Then
      await expect(codespacesService.getCodespace(codespaceId))
        .rejects.toThrow(AppError);
      await expect(codespacesService.getCodespace(codespaceId))
        .rejects.toThrow('Failed to get codespace: Codespace not found');
    });
  });

  describe('listCodespaces', () => {
    it('모든 Codespace 목록 조회 성공', async () => {
      // Given
      const mockCodespaces = [
        { id: 'codespace-1', name: 'test-codespace-1' },
        { id: 'codespace-2', name: 'test-codespace-2' },
      ];

      mockOctokit.rest.codespaces.listForAuthenticatedUser.mockResolvedValue({
        data: { codespaces: mockCodespaces },
      } as any);

      // When
      const result = await codespacesService.listCodespaces();

      // Then
      expect(result).toEqual(mockCodespaces);
      expect(mockOctokit.rest.codespaces.listForAuthenticatedUser).toHaveBeenCalledWith({
        repository_id: undefined,
      });
    });

    it('특정 저장소의 Codespace 목록 조회 성공', async () => {
      // Given
      const repositoryId = 12345;
      const mockCodespaces = [
        { id: 'codespace-1', name: 'test-codespace-1' },
      ];

      mockOctokit.rest.codespaces.listForAuthenticatedUser.mockResolvedValue({
        data: { codespaces: mockCodespaces },
      } as any);

      // When
      const result = await codespacesService.listCodespaces(repositoryId);

      // Then
      expect(result).toEqual(mockCodespaces);
      expect(mockOctokit.rest.codespaces.listForAuthenticatedUser).toHaveBeenCalledWith({
        repository_id: repositoryId,
      });
    });
  });

  describe('startCodespace', () => {
    const codespaceId = 'test-codespace-id';

    it('Codespace 시작 성공', async () => {
      // Given
      const mockCodespace = {
        id: codespaceId,
        name: 'test-codespace',
        state: 'Available',
      };

      mockOctokit.rest.codespaces.startForAuthenticatedUser.mockResolvedValue({
        data: mockCodespace,
      } as any);

      // When
      const result = await codespacesService.startCodespace(codespaceId);

      // Then
      expect(result).toEqual(mockCodespace);
      expect(mockOctokit.rest.codespaces.startForAuthenticatedUser).toHaveBeenCalledWith({
        codespace_name: codespaceId,
      });
    });
  });

  describe('stopCodespace', () => {
    const codespaceId = 'test-codespace-id';

    it('Codespace 중지 성공', async () => {
      // Given
      const mockCodespace = {
        id: codespaceId,
        name: 'test-codespace',
        state: 'Shutdown',
      };

      mockOctokit.rest.codespaces.stopForAuthenticatedUser.mockResolvedValue({
        data: mockCodespace,
      } as any);

      // When
      const result = await codespacesService.stopCodespace(codespaceId);

      // Then
      expect(result).toEqual(mockCodespace);
      expect(mockOctokit.rest.codespaces.stopForAuthenticatedUser).toHaveBeenCalledWith({
        codespace_name: codespaceId,
      });
    });
  });

  describe('deleteCodespace', () => {
    const codespaceId = 'test-codespace-id';

    it('Codespace 삭제 성공', async () => {
      // Given
      mockOctokit.rest.codespaces.deleteForAuthenticatedUser.mockResolvedValue({} as any);

      // When
      await codespacesService.deleteCodespace(codespaceId);

      // Then
      expect(mockOctokit.rest.codespaces.deleteForAuthenticatedUser).toHaveBeenCalledWith({
        codespace_name: codespaceId,
      });
    });
  });

  describe('createRepositoryWithTemplate', () => {
    const owner = 'test-owner';
    const repoName = 'test-repo';
    const description = 'Test repository';
    const aiModelConfig = { type: 'teachable-machine' };

    it('템플릿으로 저장소 및 Codespace 생성 성공', async () => {
      // Given
      const mockRepository = {
        id: 12345,
        name: repoName,
        full_name: `${owner}/${repoName}`,
      };

      const mockCodespace = {
        id: 'codespace-123',
        name: 'test-codespace',
      };

      mockOctokit.rest.repos.createForAuthenticatedUser.mockResolvedValue({
        data: mockRepository,
      } as any);

      mockOctokit.rest.codespaces.createForAuthenticatedUser.mockResolvedValue({
        data: mockCodespace,
      } as any);

      // When
      const result = await codespacesService.createRepositoryWithTemplate(
        owner,
        repoName,
        description,
        aiModelConfig
      );

      // Then
      expect(result).toEqual({
        repository: mockRepository,
        codespace: mockCodespace,
      });

      expect(mockOctokit.rest.repos.createForAuthenticatedUser).toHaveBeenCalledWith({
        name: repoName,
        description,
        private: false,
        auto_init: true,
      });
    });
  });

  describe('getAvailableMachines', () => {
    const repositoryId = 12345;

    it('사용 가능한 머신 목록 반환', async () => {
      // When
      const result = await codespacesService.getAvailableMachines(repositoryId);

      // Then
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: 'basicLinux32gb',
        display_name: 'Basic Linux (32 GB)',
        prebuild_availability: 'ready',
      });
      expect(result[1]).toEqual({
        name: 'standardLinux32gb',
        display_name: 'Standard Linux (32 GB)',
        prebuild_availability: 'ready',
      });
      expect(result[2]).toEqual({
        name: 'premiumLinux',
        display_name: 'Premium Linux',
        prebuild_availability: 'ready',
      });
    });
  });
});