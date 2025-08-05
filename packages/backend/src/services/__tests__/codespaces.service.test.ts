import 'reflect-metadata';
import { CodespacesService } from '../codespaces.service'; // Ensure correct relative path
import { Octokit } from '@octokit/rest';
import { NotFoundError, InsufficientPermissionsError, AppError } from '../../utils/errors';
import { container } from 'tsyringe';
import { logger } from '../../utils/logger';

// Mock Octokit and its rest.codespaces
const mockCreateForAuthenticatedUser = jest.fn();
const mockGetForAuthenticatedUser = jest.fn();
const mockListForAuthenticatedUser = jest.fn();
const mockStartForAuthenticatedUser = jest.fn();
const mockStopForAuthenticatedUser = jest.fn();
const mockDeleteForAuthenticatedUser = jest.fn();
const mockCreateForAuthenticatedUserRepo = jest.fn(); // For repos.createForAuthenticatedUser

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(() => ({
    rest: {
      codespaces: {
        createForAuthenticatedUser: mockCreateForAuthenticatedUser,
        getForAuthenticatedUser: mockGetForAuthenticatedUser,
        listForAuthenticatedUser: mockListForAuthenticatedUser,
        startForAuthenticatedUser: mockStartForAuthenticatedUser,
        stopForAuthenticatedUser: mockStopForAuthenticatedUser,
        deleteForAuthenticatedUser: mockDeleteForAuthenticatedUser,
      },
      repos: {
        createForAuthenticatedUser: mockCreateForAuthenticatedUserRepo,
      },
    },
  })),
}));

// Mock the logger (default export)
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CodespacesService', () => {
  let codespacesService: CodespacesService;
  let mockOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test

    // Reset the tsyringe container to ensure fresh instances for each test
    container.clearInstances();
    container.reset();

    // Set process.env.GITHUB_TOKEN for constructor to not throw error
    process.env.GITHUB_TOKEN = 'test_token';

    codespacesService = container.resolve(CodespacesService);
    mockOctokit = (Octokit as unknown as jest.MockedClass<typeof Octokit>).mock.results[0].value;
  });

  afterEach(() => {
    delete process.env.GITHUB_TOKEN; // Clean up
  });

  describe('createCodespace', () => {
    const mockRepositoryId = 123;
    const mockConfig = {
      repositoryName: 'test-repo',
      branch: 'main',
      machine: 'basicLinux32gb',
    };

    it('should create a codespace successfully and return its data', async () => {
      mockCreateForAuthenticatedUser.mockResolvedValueOnce({
        data: {
          id: 'cs123',
          name: 'test-codespace',
          state: 'Available',
          web_url: 'https://codespaces.github.com/test-url',
        },
      });

      const result = await codespacesService.createCodespace(mockRepositoryId, mockConfig);

      expect(mockCreateForAuthenticatedUser).toHaveBeenCalledWith({
        repository_id: mockRepositoryId,
        ref: mockConfig.branch,
        machine: mockConfig.machine,
        devcontainer_path: undefined,
        idle_timeout_minutes: 30,
      });
      expect(result).toEqual({
        id: 'cs123',
        name: 'test-codespace',
        state: 'Available',
        web_url: 'https://codespaces.github.com/test-url',
      });
      expect(logger.info).toHaveBeenCalledWith('Creating codespace', { repositoryId: mockRepositoryId, config: mockConfig });
      expect(logger.info).toHaveBeenCalledWith('Codespace created successfully', { codespaceId: 'cs123', name: 'test-codespace' });
    });

    it('should throw AppError if codespace creation fails', async () => {
      const errorMessage = 'GitHub API error';
      mockCreateForAuthenticatedUser.mockRejectedValueOnce(new Error(errorMessage));

      await expect(codespacesService.createCodespace(mockRepositoryId, mockConfig)).rejects.toThrow(AppError);
      await expect(codespacesService.createCodespace(mockRepositoryId, mockConfig)).rejects.toHaveProperty('message', `Failed to create codespace: ${errorMessage}`);
      expect(logger.error).toHaveBeenCalledWith('Failed to create codespace', { error: errorMessage, repositoryId: mockRepositoryId, config: mockConfig });
    });
  });

  describe('getCodespace', () => {
    const mockCodespaceId = 'test-codespace-id';

    it('should return codespace information successfully', async () => {
      mockGetForAuthenticatedUser.mockResolvedValueOnce({
        data: {
          id: mockCodespaceId,
          name: 'test-codespace',
          state: 'Available',
          web_url: 'https://codespaces.github.com/test-url',
        },
      });

      const result = await codespacesService.getCodespace(mockCodespaceId);

      expect(mockGetForAuthenticatedUser).toHaveBeenCalledWith({ codespace_name: mockCodespaceId });
      expect(result).toEqual({
        id: mockCodespaceId,
        name: 'test-codespace',
        state: 'Available',
        web_url: 'https://codespaces.github.com/test-url',
      });
    });

    it('should throw NotFoundError if codespace is not found (404)', async () => {
      const error = new Error('Not Found');
      (error as any).status = 404; // Simulate Octokit error structure
      mockGetForAuthenticatedUser.mockRejectedValueOnce(error);

      await expect(codespacesService.getCodespace(mockCodespaceId)).rejects.toThrow(NotFoundError);
      expect(logger.error).toHaveBeenCalledWith('Failed to get codespace', { error: 'Not Found', codespaceId: mockCodespaceId });
    });

    it('should throw AppError for other errors', async () => {
      const errorMessage = 'API rate limit exceeded';
      mockGetForAuthenticatedUser.mockRejectedValueOnce(new Error(errorMessage));

      await expect(codespacesService.getCodespace(mockCodespaceId)).rejects.toThrow(AppError);
      await expect(codespacesService.getCodespace(mockCodespaceId)).rejects.toHaveProperty('message', `Failed to get codespace: ${errorMessage}`);
      expect(logger.error).toHaveBeenCalledWith('Failed to get codespace', { error: errorMessage, codespaceId: mockCodespaceId });
    });
  });

  describe('listCodespaces', () => {
    it('should list codespaces successfully', async () => {
      mockListForAuthenticatedUser.mockResolvedValueOnce({
        data: {
          codespaces: [{ id: 'cs1' }, { id: 'cs2' }],
        },
      });

      const result = await codespacesService.listCodespaces();

      expect(mockListForAuthenticatedUser).toHaveBeenCalledWith({});
      expect(result).toEqual([{ id: 'cs1' }, { id: 'cs2' }]);
    });

    it('should list codespaces for a specific repository', async () => {
      const mockRepoId = 789;
      mockListForAuthenticatedUser.mockResolvedValueOnce({
        data: {
          codespaces: [{ id: 'cs3' }],
        },
      });

      const result = await codespacesService.listCodespaces(mockRepoId);

      expect(mockListForAuthenticatedUser).toHaveBeenCalledWith({ repository_id: mockRepoId });
      expect(result).toEqual([{ id: 'cs3' }]);
    });

    it('should throw AppError if listing codespaces fails', async () => {
      const errorMessage = 'Failed to fetch';
      mockListForAuthenticatedUser.mockRejectedValueOnce(new Error(errorMessage));

      await expect(codespacesService.listCodespaces()).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to list codespaces', { error: errorMessage, repositoryId: undefined });
    });
  });

  describe('startCodespace', () => {
    const mockCodespaceId = 'test-codespace-id';

    it('should start a codespace successfully', async () => {
      mockStartForAuthenticatedUser.mockResolvedValueOnce({
        data: {
          id: mockCodespaceId,
          state: 'Available',
        },
      });

      const result = await codespacesService.startCodespace(mockCodespaceId);

      expect(mockStartForAuthenticatedUser).toHaveBeenCalledWith({ codespace_name: mockCodespaceId });
      expect(result).toEqual({ id: mockCodespaceId, state: 'Available' });
    });

    it('should throw AppError if starting codespace fails', async () => {
      const errorMessage = 'Cannot start codespace';
      mockStartForAuthenticatedUser.mockRejectedValueOnce(new Error(errorMessage));

      await expect(codespacesService.startCodespace(mockCodespaceId)).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to start codespace', { error: errorMessage, codespaceId: mockCodespaceId });
    });
  });

  describe('stopCodespace', () => {
    const mockCodespaceId = 'test-codespace-id';

    it('should stop a codespace successfully', async () => {
      mockStopForAuthenticatedUser.mockResolvedValueOnce({
        data: {
          id: mockCodespaceId,
          state: 'Stopped',
        },
      });

      const result = await codespacesService.stopCodespace(mockCodespaceId);

      expect(mockStopForAuthenticatedUser).toHaveBeenCalledWith({ codespace_name: mockCodespaceId });
      expect(result).toEqual({ id: mockCodespaceId, state: 'Stopped' });
    });

    it('should throw AppError if stopping codespace fails', async () => {
      const errorMessage = 'Cannot stop codespace';
      mockStopForAuthenticatedUser.mockRejectedValueOnce(new Error(errorMessage));

      await expect(codespacesService.stopCodespace(mockCodespaceId)).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to stop codespace', { error: errorMessage, codespaceId: mockCodespaceId });
    });
  });

  describe('deleteCodespace', () => {
    const mockCodespaceId = 'test-codespace-id';

    it('should delete a codespace successfully', async () => {
      mockDeleteForAuthenticatedUser.mockResolvedValueOnce({});

      await codespacesService.deleteCodespace(mockCodespaceId);

      expect(mockDeleteForAuthenticatedUser).toHaveBeenCalledWith({ codespace_name: mockCodespaceId });
      expect(logger.info).toHaveBeenCalledWith('Codespace deleted successfully', { codespaceId: mockCodespaceId });
    });

    it('should throw AppError if deleting codespace fails', async () => {
      const errorMessage = 'Failed to delete';
      mockDeleteForAuthenticatedUser.mockRejectedValueOnce(new Error(errorMessage));

      await expect(codespacesService.deleteCodespace(mockCodespaceId)).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to delete codespace', { error: errorMessage, codespaceId: mockCodespaceId });
    });
  });

  describe('createRepositoryWithTemplate', () => {
    const mockOwner = 'test-owner';
    const mockRepoName = 'new-repo';
    const mockDescription = 'A new test repository';
    const mockAiModelConfig = { type: 'teachable-machine' };
    const mockRepositoryId = 123;

    it('should create a repository and a codespace successfully', async () => {
      mockCreateForAuthenticatedUserRepo.mockResolvedValueOnce({
        data: {
          id: mockRepositoryId,
          name: mockRepoName,
          html_url: `https://github.com/${mockOwner}/${mockRepoName}`,
        },
      });
      mockCreateForAuthenticatedUser.mockResolvedValueOnce({
        data: {
          id: 'cs-new',
          name: 'new-codespace',
          web_url: 'https://codespaces.github.com/new-codespace',
        },
      });

      const result = await codespacesService.createRepositoryWithTemplate(
        mockOwner,
        mockRepoName,
        mockDescription,
        mockAiModelConfig
      );

      expect(mockCreateForAuthenticatedUserRepo).toHaveBeenCalledWith({
        name: mockRepoName,
        description: mockDescription,
        private: false,
        auto_init: true,
      });
      expect(mockCreateForAuthenticatedUser).toHaveBeenCalledWith({
        repository_id: mockRepositoryId,
        ref: 'main',
        machine: 'basicLinux32gb', // Default machine
        devcontainer_path: undefined,
        idle_timeout_minutes: 30,
      });
      expect(result.repository).toEqual({
        id: mockRepositoryId,
        name: mockRepoName,
        html_url: `https://github.com/${mockOwner}/${mockRepoName}`,
      });
      expect(result.codespace).toEqual({
        id: 'cs-new',
        name: 'new-codespace',
        web_url: 'https://codespaces.github.com/new-codespace',
      });
    });

    it('should throw AppError if repository creation fails', async () => {
      const errorMessage = 'Repo creation failed';
      mockCreateForAuthenticatedUserRepo.mockRejectedValueOnce(new Error(errorMessage));

      await expect(codespacesService.createRepositoryWithTemplate(
        mockOwner, mockRepoName, mockDescription, mockAiModelConfig
      )).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to create repository with template', {
        error: errorMessage,
        owner: mockOwner,
        repoName: mockRepoName,
      });
    });

    it('should throw AppError if codespace creation fails after repo creation', async () => {
      mockCreateForAuthenticatedUserRepo.mockResolvedValueOnce({
        data: {
          id: mockRepositoryId,
          name: mockRepoName,
          html_url: `https://github.com/${mockOwner}/${mockRepoName}`,
        },
      });
      const errorMessage = 'Codespace creation failed';
      mockCreateForAuthenticatedUser.mockRejectedValueOnce(new Error(errorMessage));

      await expect(codespacesService.createRepositoryWithTemplate(
        mockOwner, mockRepoName, mockDescription, mockAiModelConfig
      )).rejects.toThrow(AppError);
      expect(logger.error).toHaveBeenCalledWith('Failed to create repository with template', {
        error: errorMessage,
        owner: mockOwner,
        repoName: mockRepoName,
      });
    });
  });

  describe('getAvailableMachines', () => {
    it('should return a list of default available machines', async () => {
      const mockRepositoryId = 123;
      const expectedMachines = [
        { name: 'basicLinux32gb', display_name: 'Basic Linux (32 GB)', prebuild_availability: 'ready' },
        { name: 'standardLinux32gb', display_name: 'Standard Linux (32 GB)', prebuild_availability: 'ready' },
        { name: 'premiumLinux', display_name: 'Premium Linux', prebuild_availability: 'ready' }
      ];

      const result = await codespacesService.getAvailableMachines(mockRepositoryId);

      expect(result).toEqual(expectedMachines);
      expect(logger.error).not.toHaveBeenCalled(); // Ensure no error logged for successful path
    });
  });
});
