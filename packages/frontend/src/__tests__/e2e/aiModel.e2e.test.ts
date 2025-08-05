import { test, expect } from '@playwright/test';

test.describe('AI Model Integration E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
            },
          },
        }),
      });
    });

    await page.route('**/api/projects', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              projects: [
                {
                  id: 'test-project-id',
                  name: 'AI Test Project',
                  description: 'Project for AI model testing',
                  status: 'active',
                  aiModel: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
              pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
              },
            },
          }),
        });
      }
    });

    await page.route('**/api/projects/test-project-id/ai-model', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                id: 'test-project-id',
                name: 'AI Test Project',
                aiModel: requestBody,
                updatedAt: new Date().toISOString(),
              },
            },
            message: 'AI model connected successfully',
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              hasModel: true,
              config: {
                type: 'teachable-machine',
                modelUrl: 'https://teachablemachine.withgoogle.com/models/test-model/',
                labels: ['cat', 'dog'],
                inputType: 'image',
              },
              status: 'connected',
            },
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'AI model disconnected successfully',
          }),
        });
      }
    });

    await page.route('**/api/projects/test-project-id/ai-model/test', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            success: true,
            predictions: [
              { label: 'cat', confidence: 0.85 },
              { label: 'dog', confidence: 0.15 },
            ],
            modelType: 'teachable-machine',
          },
        }),
      });
    });

    await page.route('**/api/ai-models/types', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            types: [
              {
                id: 'teachable-machine',
                name: 'Teachable Machine',
                description: 'Google\\'s Teachable Machine for image, audio, and text classification',
                inputTypes: ['image', 'audio', 'text'],
              },
              {
                id: 'hugging-face',
                name: 'Hugging Face',
                description: 'Hugging Face models for various AI tasks',
                inputTypes: ['text', 'image'],
              },
            ],
          },
        }),
      });
    });

    // Navigate to login page and simulate login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('AI 모델 연결부터 테스트까지 전체 플로우', async ({ page }) => {
    // 1. 프로젝트 페이지로 이동
    await page.click('[data-testid="projects-nav"]');
    await page.waitForURL('/projects');

    // 2. 프로젝트 선택
    await page.click('[data-testid="project-card-test-project-id"]');
    await page.waitForURL('/projects/test-project-id');

    // 3. AI 모델 탭으로 이동
    await page.click('[data-testid="ai-model-tab"]');

    // 4. AI 모델 연결 버튼 클릭
    await page.click('[data-testid="connect-ai-model-button"]');

    // 5. AI 모델 타입 선택 (Teachable Machine)
    await page.click('[data-testid="model-type-teachable-machine"]');

    // 6. 모델 설정 입력
    await page.fill('[data-testid="model-url-input"]', 'https://teachablemachine.withgoogle.com/models/test-model/');
    await page.fill('[data-testid="model-labels-input"]', 'cat,dog');
    await page.selectOption('[data-testid="input-type-select"]', 'image');

    // 7. 모델 연결 확인
    await page.click('[data-testid="connect-model-confirm-button"]');

    // 8. 연결 성공 메시지 확인
    await expect(page.locator('[data-testid="success-message"]')).toContainText('AI model connected successfully');

    // 9. 모델 테스트 섹션으로 이동
    await page.click('[data-testid="test-model-section"]');

    // 10. 테스트 입력 데이터 제공
    await page.fill('[data-testid="test-input"]', 'test image data');

    // 11. 모델 테스트 실행
    await page.click('[data-testid="test-model-button"]');

    // 12. 테스트 결과 확인
    await expect(page.locator('[data-testid="test-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="prediction-cat"]')).toContainText('cat: 85%');
    await expect(page.locator('[data-testid="prediction-dog"]')).toContainText('dog: 15%');

    // 13. 모델 연결 해제
    await page.click('[data-testid="disconnect-model-button"]');
    await page.click('[data-testid="confirm-disconnect-button"]');

    // 14. 연결 해제 확인
    await expect(page.locator('[data-testid="no-model-message"]')).toContainText('No AI model connected');
  });
});