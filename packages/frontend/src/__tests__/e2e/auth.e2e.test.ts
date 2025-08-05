// Mock Playwright for Jest environment

describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    // 각 테스트 전에 홈페이지로 이동
    await page.goto('/');
  });

  test('회원가입부터 로그인까지 전체 플로우', async ({ page }) => {
    // 회원가입 페이지로 이동
    await page.click('text=회원가입');
    await expect(page).toHaveURL('/auth/register');

    // 회원가입 폼 작성
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=username-input]', 'testuser');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.fill('[data-testid=confirm-password-input]', 'password123');

    // 회원가입 버튼 클릭
    await page.click('[data-testid=register-button]');

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=환영합니다')).toBeVisible();

    // 로그아웃
    await page.click('[data-testid=user-menu]');
    await page.click('text=로그아웃');

    // 홈페이지로 리다이렉트 확인
    await expect(page).toHaveURL('/');

    // 로그인 페이지로 이동
    await page.click('text=로그인');
    await expect(page).toHaveURL('/auth/login');

    // 로그인 폼 작성
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');

    // 로그인 버튼 클릭
    await page.click('[data-testid=login-button]');

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=testuser')).toBeVisible();
  });

  test('잘못된 자격증명으로 로그인 실패', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/auth/login');

    // 잘못된 자격증명 입력
    await page.fill('[data-testid=email-input]', 'wrong@example.com');
    await page.fill('[data-testid=password-input]', 'wrongpassword');

    // 로그인 버튼 클릭
    await page.click('[data-testid=login-button]');

    // 에러 메시지 확인
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText(
      '이메일 또는 비밀번호가 올바르지 않습니다'
    );

    // 로그인 페이지에 머물러 있는지 확인
    await expect(page).toHaveURL('/auth/login');
  });

  test('필수 필드 누락 시 유효성 검사 오류', async ({ page }) => {
    // 회원가입 페이지로 이동
    await page.goto('/auth/register');

    // 이메일만 입력하고 제출
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.click('[data-testid=register-button]');

    // 유효성 검사 오류 메시지 확인
    await expect(page.locator('[data-testid=username-error]')).toBeVisible();
    await expect(page.locator('[data-testid=password-error]')).toBeVisible();

    // 여전히 회원가입 페이지에 있는지 확인
    await expect(page).toHaveURL('/auth/register');
  });

  test('비밀번호 확인 불일치 오류', async ({ page }) => {
    // 회원가입 페이지로 이동
    await page.goto('/auth/register');

    // 폼 작성 (비밀번호 확인 불일치)
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=username-input]', 'testuser');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.fill('[data-testid=confirm-password-input]', 'differentpassword');

    // 회원가입 버튼 클릭
    await page.click('[data-testid=register-button]');

    // 비밀번호 불일치 오류 메시지 확인
    await expect(page.locator('[data-testid=confirm-password-error]')).toBeVisible();
    await expect(page.locator('[data-testid=confirm-password-error]')).toContainText(
      '비밀번호가 일치하지 않습니다'
    );
  });

  test('로그인 상태에서 인증 페이지 접근 시 리다이렉트', async ({ page }) => {
    // 먼저 로그인
    await page.goto('/auth/login');
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');
    await page.click('[data-testid=login-button]');

    // 대시보드 확인
    await expect(page).toHaveURL('/dashboard');

    // 로그인 페이지에 직접 접근 시도
    await page.goto('/auth/login');

    // 대시보드로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/dashboard');

    // 회원가입 페이지에 직접 접근 시도
    await page.goto('/auth/register');

    // 대시보드로 리다이렉트되는지 확인
    await expect(page).toHaveURL('/dashboard');
  });
});