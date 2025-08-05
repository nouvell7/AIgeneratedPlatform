import 'reflect-metadata';
import { DeploymentController } from '../deployment.controller';
import { container } from 'tsyringe';
import { DeploymentService } from '../../services/deployment.service';

// Mock the service
const mockDeploymentService = {
  startDeployment: jest.fn(),
  getDeploymentStatus: jest.fn(),
  getDeploymentLogs: jest.fn(),
  cancelDeployment: jest.fn(),
  rollbackDeployment: jest.fn(),
  getDeploymentHistory: jest.fn(),
  getDeploymentMetrics: jest.fn(),
};

describe('DeploymentController Simple Test', () => {
  let controller: DeploymentController;

  beforeEach(() => {
    container.clearInstances();
    container.registerInstance(DeploymentService, mockDeploymentService as any);
    controller = new DeploymentController();
    jest.clearAllMocks();
  });

  it('컨트롤러가 생성되고 서비스가 주입됨', () => {
    expect(controller).toBeDefined();
    expect((controller as any).deploymentService).toBeDefined();
  });

  it('startDeployment 메서드가 서비스를 호출함', async () => {
    // Given
    const mockReq = {
      params: { projectId: 'test-project' },
      user: { userId: 'test-user' },
      body: { platform: 'cloudflare-pages' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    mockDeploymentService.startDeployment.mockResolvedValue({
      id: 'deployment-123',
      status: 'pending',
    });

    // When
    await controller.startDeployment[0](mockReq as any, mockRes as any, mockNext);

    // Then
    expect(mockDeploymentService.startDeployment).toHaveBeenCalledWith(
      'test-project',
      'test-user',
      { platform: 'cloudflare-pages' }
    );
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: { deployment: { id: 'deployment-123', status: 'pending' } },
      message: 'Deployment started successfully',
    });
  });
});