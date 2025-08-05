// Mock Playwright for Jest environment
const mockTest = {
  describe: describe,
  beforeEach: beforeEach,
};

describe('프로젝트 관리 E2E 테스트', () => {
  beforeEach(() => {
    // Mock API responses
    await page.route('**/api/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              username: 'testuser',
              role: 'USER',
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
                  id: 'project-1',
                  name: 'Test Project 1',
                  description: 'Test Description 1',
                  category: 'web-app',
                  status: 'DRAFT',
                  projectType: 'LOW_CODE',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                {
                  id: 'project-2',
                  name: 'Test Project 2',
                  description: 'Test Description 2',
                  category: 'api',
                  status: 'DEPLOYED',
                  projectType: 'NO_CODE',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
              pagination: {
                page: 1,
                totalPages: 1,
                total: 2,
                hasMore: false,
              },
            },
          }),
        });
      } else if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                id: 'new-project-id',
                name: requestBody.name,
                description: requestBody.description,
                category: requestBody.category,
                status: 'DRAFT',
                projectType: requestBody.projectType || 'LOW_CODE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
            message: 'Project created successfully',
          }),
        });
      }
    });

    await page.route('**/api/projects/new-project-id', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                id: 'new-project-id',
                name: 'New Test Project',
                description: 'New Test Description',
                category: 'web-app',
                status: 'DRAFT',
                projectType: 'LOW_CODE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          }),
        });
      } else if (route.request().method() === 'PUT') {
        const requestBody = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                id: 'new-project-id',
                name: requestBody.name || 'New Test Project',
                description: requestBody.description || 'New Test Description',
                category: 'web-app',
                status: requestBody.status || 'DRAFT',
                projectType: 'LOW_CODE',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
            message: 'Project updated successfully',
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Project deleted successfully',
          }),
        });
      }
    });

    // Set authentication token
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-jwt-token');
    });
  });

  it('프로젝트 생성부터 배포까지 전체 플로우', async () => {
    // 1. 프로젝트 목록 페이지로 이동
    await page.goto('/projects');
    await expect(page).toHaveTitle(/Projects/);

    // 2. 기존 프로젝트들이 표시되는지 확인
    await expect(page.locator('text=Test Project 1')).toBeVisible();
    await expect(page.locator('text=Test Project 2')).toBeVisible();

    // 3. 새 프로젝트 생성 버튼 클릭
    await page.click('button:has-text("New Project"), button:has-text("Create Project"), [data-testid="create-project-button"]');

    // 4. 프로젝트 생성 모달이 열리는지 확인
    await expect(page.locator('[data-testid="create-project-modal"], .modal, [role="dialog"]')).toBeVisible();

    // 5. 프로젝트 정보 입력
    await page.fill('input[name="name"], input[placeholder*="name"], input[placeholder*="Name"]', 'New Test Project');
    await page.fill('textarea[name="description"], textarea[placeholder*="description"], textarea[placeholder*="Description"]', 'New Test Description');
    
    // 카테고리 선택 (드롭다운 또는 라디오 버튼)
    const categorySelector = page.locator('select[name="category"], input[name="category"][value="web-app"]');
    if (await categorySelector.first().isVisible()) {
      if (await page.locator('select[name="category"]').isVisible()) {
        await page.selectOption('select[name="category"]', 'web-app');
      } else {
        await page.click('input[name="category"][value="web-app"]');
      }
    }

    // 6. 프로젝트 생성 제출
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Submit")');

    // 7. 프로젝트 상세 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/\/projects\/new-project-id/);

    // 8. 프로젝트 상세 정보가 표시되는지 확인
    await expect(page.locator('text=New Test Project')).toBeVisible();
    await expect(page.locator('text=New Test Description')).toBeVisible();
    await expect(page.locator('text=DRAFT')).toBeVisible();

    // 9. 프로젝트 편집 버튼 클릭
    await page.click('button:has-text("Edit"), button:has-text("Update"), [data-testid="edit-project-button"]');

    // 10. 프로젝트 정보 수정
    await page.fill('input[name="name"], input[value="New Test Project"]', 'Updated Test Project');
    await page.fill('textarea[name="description"], textarea:has-text("New Test Description")', 'Updated Test Description');

    // 11. 상태를 DEVELOPING으로 변경
    const statusSelector = page.locator('select[name="status"], input[name="status"][value="DEVELOPING"]');
    if (await statusSelector.first().isVisible()) {
      if (await page.locator('select[name="status"]').isVisible()) {
        await page.selectOption('select[name="status"]', 'DEVELOPING');
      } else {
        await page.click('input[name="status"][value="DEVELOPING"]');
      }
    }

    // 12. 수정 사항 저장
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');

    // 13. 수정된 정보가 반영되는지 확인
    await expect(page.locator('text=Updated Test Project')).toBeVisible();
    await expect(page.locator('text=Updated Test Description')).toBeVisible();

    // 14. 성공 메시지 확인
    await expect(page.locator('text=successfully, text=Success')).toBeVisible();
  });

  it('No-Code 프로젝트 생성 및 페이지 편집 플로우', async () => {
    // Mock No-Code project creation
    await page.route('**/api/projects', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                id: 'nocode-project-id',
                name: requestBody.name,
                description: requestBody.description,
                category: requestBody.category,
                status: 'DRAFT',
                projectType: 'NO_CODE',
                pageContent: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
            message: 'Project created successfully',
          }),
        });
      }
    });

    await page.route('**/api/projects/nocode-project-id', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                id: 'nocode-project-id',
                name: 'No-Code Test Project',
                description: 'No-Code Test Description',
                category: 'web-app',
                status: 'DRAFT',
                projectType: 'NO_CODE',
                pageContent: {
                  title: 'My Page',
                  content: 'Hello World',
                  backgroundColor: '#ffffff',
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          }),
        });
      }
    });

    await page.route('**/api/projects/nocode-project-id/page-content', async (route) => {
      if (route.request().method() === 'PUT') {
        const requestBody = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              project: {
                id: 'nocode-project-id',
                name: 'No-Code Test Project',
                description: 'No-Code Test Description',
                category: 'web-app',
                status: 'DRAFT',
                projectType: 'NO_CODE',
                pageContent: requestBody.pageContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
            message: 'Project page content updated successfully',
          }),
        });
      }
    });

    // 1. 프로젝트 목록 페이지로 이동
    await page.goto('/projects');

    // 2. 새 프로젝트 생성
    await page.click('button:has-text("New Project"), button:has-text("Create Project"), [data-testid="create-project-button"]');

    // 3. No-Code 프로젝트 타입 선택
    await page.fill('input[name="name"], input[placeholder*="name"]', 'No-Code Test Project');
    await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'No-Code Test Description');
    
    // 프로젝트 타입을 NO_CODE로 선택
    const projectTypeSelector = page.locator('select[name="projectType"], input[name="projectType"][value="NO_CODE"]');
    if (await projectTypeSelector.first().isVisible()) {
      if (await page.locator('select[name="projectType"]').isVisible()) {
        await page.selectOption('select[name="projectType"]', 'NO_CODE');
      } else {
        await page.click('input[name="projectType"][value="NO_CODE"]');
      }
    }

    // 카테고리 선택
    const categorySelector = page.locator('select[name="category"], input[name="category"][value="web-app"]');
    if (await categorySelector.first().isVisible()) {
      if (await page.locator('select[name="category"]').isVisible()) {
        await page.selectOption('select[name="category"]', 'web-app');
      } else {
        await page.click('input[name="category"][value="web-app"]');
      }
    }

    // 4. 프로젝트 생성
    await page.click('button[type="submit"], button:has-text("Create")');

    // 5. 프로젝트 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/projects\/nocode-project-id/);

    // 6. No-Code 에디터가 표시되는지 확인
    await expect(page.locator('text=No-Code Test Project')).toBeVisible();
    await expect(page.locator('[data-testid="nocode-editor"], .page-editor, .visual-editor')).toBeVisible();

    // 7. 페이지 콘텐츠 편집
    await page.fill('input[name="title"], input[placeholder*="title"]', 'Updated Page Title');
    await page.fill('textarea[name="content"], textarea[placeholder*="content"]', 'Updated page content');

    // 8. 배경색 변경 (색상 선택기가 있다면)
    const colorPicker = page.locator('input[type="color"], input[name="backgroundColor"]');
    if (await colorPicker.isVisible()) {
      await colorPicker.fill('#ff0000');
    }

    // 9. 페이지 콘텐츠 저장
    await page.click('button:has-text("Save Page"), button:has-text("Update Content"), [data-testid="save-page-content"]');

    // 10. 성공 메시지 확인
    await expect(page.locator('text=successfully, text=Success')).toBeVisible();

    // 11. 페이지 미리보기 확인
    const previewButton = page.locator('button:has-text("Preview"), [data-testid="preview-button"]');
    if (await previewButton.isVisible()) {
      await previewButton.click();
      await expect(page.locator('text=Updated Page Title')).toBeVisible();
      await expect(page.locator('text=Updated page content')).toBeVisible();
    }
  });
});