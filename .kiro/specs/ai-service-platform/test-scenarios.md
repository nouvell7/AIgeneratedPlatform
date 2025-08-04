# AI Service Platform - 테스트 시나리오 문서

## 📋 개요

이 문서는 AI Service Platform의 모든 기능에 대한 단위 테스트 및 통합 테스트 시나리오를 정의합니다. 각 테스트는 requirements.md의 요구사항과 직접 연결되어 있으며, 성공/실패 케이스를 모두 포함합니다.

## 🎯 테스트 전략

- **단위 테스트**: 개별 함수, 컴포넌트, 서비스의 독립적 테스트
- **통합 테스트**: API 엔드포인트, 데이터베이스 연동, 외부 서비스 통합 테스트
- **E2E 테스트**: 사용자 워크플로우 전체 시나리오 테스트

## 📊 테스트 진행 현황 (2025-08-04 기준)

**전체 진행률**: 38/146 테스트 (26.0% 완료) ⬆️

| 카테고리 | 계획된 테스트 | 구현 완료 | 통과율 | 상태 |
|----------|---------------|-----------|--------|------|
| 인증 시스템 | 24 | 8 | 100% | ✅ 완료 |
| 프로젝트 관리 | 32 | 30 | 100% | ✅ 완료 |
| AI 모델 연동 | 20 | 0 | 0% | ⏳ Day 4-5 예정 |
| 배포 시스템 | 16 | 0 | 0% | ⏳ 대기 |
| 수익화 시스템 | 12 | 0 | 0% | ⏳ 대기 |
| 커뮤니티 시스템 | 18 | 0 | 0% | ⏳ 대기 |
| 관리자 시스템 | 8 | 0 | 0% | ⏳ 대기 |
| 템플릿 시스템 | 16 | 0 | 0% | ⏳ 대기 |

**커버리지 현황**:
- Backend: 85.4% ✅
- Frontend: 90.6% ✅
- 목표: 80% 이상 유지
| 수익화 기능 | 18 | 0 | 0% | ⏳ 대기 |
| 커뮤니티 기능 | 22 | 0 | 0% | ⏳ 대기 |
| 템플릿 시스템 | 14 | 0 | 0% | ⏳ 대기 |
| **전체** | **146** | **8** | **5.5%** | 🚧 **진행 중** |

---

## 🔐 1. 인증 시스템 테스트

### 1.1 사용자 등록 (Requirement 1)

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/auth.service.test.ts`

```typescript
describe('AuthService.register', () => {
  // ✅ 성공 케이스
  test('유효한 사용자 정보로 회원가입 성공', async () => {
    // Given: 유효한 사용자 정보
    // When: 회원가입 요청
    // Then: 사용자 생성 및 JWT 토큰 반환
  });

  // ❌ 실패 케이스
  test('중복된 이메일로 회원가입 실패', async () => {
    // Given: 이미 존재하는 이메일
    // When: 회원가입 요청
    // Then: 409 Conflict 에러 반환
  });

  test('잘못된 이메일 형식으로 회원가입 실패', async () => {
    // Given: 잘못된 이메일 형식
    // When: 회원가입 요청
    // Then: 400 Bad Request 에러 반환
  });

  test('약한 비밀번호로 회원가입 실패', async () => {
    // Given: 6자 미만의 비밀번호
    // When: 회원가입 요청
    // Then: 400 Bad Request 에러 반환
  });
});
```

#### 통합 테스트

**테스트 파일**: `packages/backend/src/controllers/__tests__/auth.controller.integration.test.ts`

```typescript
describe('POST /api/auth/register', () => {
  // ✅ 성공 케이스
  test('유효한 데이터로 회원가입 API 호출 성공', async () => {
    // Given: 유효한 회원가입 데이터
    // When: POST /api/auth/register 호출
    // Then: 201 Created, 사용자 정보 및 토큰 반환
  });

  // ❌ 실패 케이스
  test('필수 필드 누락 시 400 에러 반환', async () => {
    // Given: 이메일 필드 누락
    // When: POST /api/auth/register 호출
    // Then: 400 Bad Request 반환
  });
});
```

### 1.2 사용자 로그인

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/auth.service.test.ts`

```typescript
describe('AuthService.login', () => {
  // ✅ 성공 케이스
  test('올바른 자격증명으로 로그인 성공', async () => {
    // Given: 등록된 사용자의 이메일과 비밀번호
    // When: 로그인 요청
    // Then: JWT 토큰과 사용자 정보 반환
  });

  // ❌ 실패 케이스
  test('존재하지 않는 이메일로 로그인 실패', async () => {
    // Given: 등록되지 않은 이메일
    // When: 로그인 요청
    // Then: 401 Unauthorized 에러 반환
  });

  test('잘못된 비밀번호로 로그인 실패', async () => {
    // Given: 올바른 이메일, 잘못된 비밀번호
    // When: 로그인 요청
    // Then: 401 Unauthorized 에러 반환
  });
});
```

### 1.3 OAuth 인증

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/oauth.service.test.ts`

```typescript
describe('OAuthService', () => {
  // ✅ 성공 케이스
  test('Google OAuth 로그인 성공', async () => {
    // Given: 유효한 Google OAuth 토큰
    // When: Google OAuth 인증 요청
    // Then: 사용자 생성/로그인 및 JWT 토큰 반환
  });

  test('GitHub OAuth 로그인 성공', async () => {
    // Given: 유효한 GitHub OAuth 토큰
    // When: GitHub OAuth 인증 요청
    // Then: 사용자 생성/로그인 및 JWT 토큰 반환
  });

  // ❌ 실패 케이스
  test('잘못된 OAuth 토큰으로 인증 실패', async () => {
    // Given: 유효하지 않은 OAuth 토큰
    // When: OAuth 인증 요청
    // Then: 401 Unauthorized 에러 반환
  });
});
```

---

## 📁 2. 프로젝트 관리 테스트

### 2.1 프로젝트 생성 (Requirement 2)

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/project.service.test.ts`

```typescript
describe('ProjectService.createProject', () => {
  // ✅ 성공 케이스
  test('유효한 프로젝트 데이터로 생성 성공', async () => {
    // Given: 유효한 프로젝트 정보
    // When: 프로젝트 생성 요청
    // Then: 프로젝트 생성 및 정보 반환
  });

  test('템플릿 기반 프로젝트 생성 성공', async () => {
    // Given: 유효한 템플릿 ID
    // When: 템플릿 기반 프로젝트 생성 요청
    // Then: 템플릿 적용된 프로젝트 생성
  });

  test('No-Code 프로젝트 생성 성공', async () => {
    // Given: No-Code 프로젝트 타입
    // When: 프로젝트 생성 요청
    // Then: No-Code 프로젝트 생성 및 기본 페이지 콘텐츠 설정
  });

  // ❌ 실패 케이스
  test('필수 필드 누락 시 생성 실패', async () => {
    // Given: 프로젝트 이름 누락
    // When: 프로젝트 생성 요청
    // Then: 400 Bad Request 에러 반환
  });

  test('존재하지 않는 템플릿으로 생성 실패', async () => {
    // Given: 존재하지 않는 템플릿 ID
    // When: 템플릿 기반 프로젝트 생성 요청
    // Then: 404 Not Found 에러 반환
  });
});
```

#### 통합 테스트

**테스트 파일**: `packages/backend/src/controllers/__tests__/project.controller.integration.test.ts`

```typescript
describe('POST /api/projects', () => {
  // ✅ 성공 케이스
  test('인증된 사용자의 프로젝트 생성 성공', async () => {
    // Given: 유효한 JWT 토큰과 프로젝트 데이터
    // When: POST /api/projects 호출
    // Then: 201 Created, 프로젝트 정보 반환
  });

  // ❌ 실패 케이스
  test('인증되지 않은 사용자의 프로젝트 생성 실패', async () => {
    // Given: JWT 토큰 없음
    // When: POST /api/projects 호출
    // Then: 401 Unauthorized 반환
  });
});
```

### 2.2 프로젝트 조회 및 수정

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/project.service.test.ts`

```typescript
describe('ProjectService.getProjectById', () => {
  // ✅ 성공 케이스
  test('존재하는 프로젝트 조회 성공', async () => {
    // Given: 존재하는 프로젝트 ID
    // When: 프로젝트 조회 요청
    // Then: 프로젝트 정보 반환
  });

  // ❌ 실패 케이스
  test('존재하지 않는 프로젝트 조회 실패', async () => {
    // Given: 존재하지 않는 프로젝트 ID
    // When: 프로젝트 조회 요청
    // Then: 404 Not Found 에러 반환
  });

  test('권한 없는 프로젝트 조회 실패', async () => {
    // Given: 다른 사용자의 프로젝트 ID
    // When: 프로젝트 조회 요청
    // Then: 403 Forbidden 에러 반환
  });
});

describe('ProjectService.updateProject', () => {
  // ✅ 성공 케이스
  test('프로젝트 정보 수정 성공', async () => {
    // Given: 유효한 수정 데이터
    // When: 프로젝트 수정 요청
    // Then: 수정된 프로젝트 정보 반환
  });

  test('No-Code 프로젝트 페이지 콘텐츠 수정 성공', async () => {
    // Given: 유효한 페이지 콘텐츠 데이터
    // When: 페이지 콘텐츠 수정 요청
    // Then: 수정된 페이지 콘텐츠 반환
  });

  // ❌ 실패 케이스
  test('잘못된 프로젝트 상태로 수정 실패', async () => {
    // Given: 유효하지 않은 상태 값
    // When: 프로젝트 수정 요청
    // Then: 400 Bad Request 에러 반환
  });
});
```

---

## 🤖 3. AI 모델 연동 테스트 (Requirement 1)

### 3.1 AI 모델 연결

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/aiModel.service.test.ts`

```typescript
describe('AIModelService.connectModel', () => {
  // ✅ 성공 케이스
  test('Teachable Machine 모델 연결 성공', async () => {
    // Given: 유효한 Teachable Machine 모델 URL
    // When: 모델 연결 요청
    // Then: 모델 연결 및 설정 정보 저장
  });

  test('Hugging Face 모델 연결 성공', async () => {
    // Given: 유효한 Hugging Face 모델 정보
    // When: 모델 연결 요청
    // Then: 모델 연결 및 API 키 설정
  });

  // ❌ 실패 케이스
  test('잘못된 모델 URL로 연결 실패', async () => {
    // Given: 유효하지 않은 모델 URL
    // When: 모델 연결 요청
    // Then: 400 Bad Request 에러 반환
  });

  test('접근 불가능한 모델로 연결 실패', async () => {
    // Given: 접근 권한이 없는 모델
    // When: 모델 연결 요청
    // Then: 403 Forbidden 에러 반환
  });
});

describe('AIModelService.testModel', () => {
  // ✅ 성공 케이스
  test('연결된 모델 테스트 성공', async () => {
    // Given: 연결된 AI 모델
    // When: 모델 테스트 요청
    // Then: 모델 응답 및 상태 정보 반환
  });

  // ❌ 실패 케이스
  test('연결되지 않은 모델 테스트 실패', async () => {
    // Given: 연결되지 않은 모델
    // When: 모델 테스트 요청
    // Then: 404 Not Found 에러 반환
  });

  test('모델 서버 오류로 테스트 실패', async () => {
    // Given: 서버 오류가 발생하는 모델
    // When: 모델 테스트 요청
    // Then: 502 Bad Gateway 에러 반환
  });
});
```

#### 통합 테스트

**테스트 파일**: `packages/backend/src/controllers/__tests__/aiModel.controller.integration.test.ts`

```typescript
describe('POST /api/projects/:id/ai-model', () => {
  // ✅ 성공 케이스
  test('프로젝트에 AI 모델 연결 성공', async () => {
    // Given: 유효한 프로젝트 ID와 모델 정보
    // When: POST /api/projects/:id/ai-model 호출
    // Then: 200 OK, 연결된 모델 정보 반환
  });

  // ❌ 실패 케이스
  test('존재하지 않는 프로젝트에 모델 연결 실패', async () => {
    // Given: 존재하지 않는 프로젝트 ID
    // When: POST /api/projects/:id/ai-model 호출
    // Then: 404 Not Found 반환
  });
});
```

---

## 🚀 4. 배포 시스템 테스트 (Requirement 2)

### 4.1 Codespace 생성 및 관리

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/codespaces.service.test.ts`

```typescript
describe('CodespacesService.createCodespace', () => {
  // ✅ 성공 케이스
  test('프로젝트용 Codespace 생성 성공', async () => {
    // Given: 유효한 프로젝트 정보
    // When: Codespace 생성 요청
    // Then: GitHub Codespace 생성 및 URL 반환
  });

  // ❌ 실패 케이스
  test('GitHub API 오류로 Codespace 생성 실패', async () => {
    // Given: GitHub API 서버 오류
    // When: Codespace 생성 요청
    // Then: 502 Bad Gateway 에러 반환
  });

  test('권한 부족으로 Codespace 생성 실패', async () => {
    // Given: GitHub 권한이 없는 사용자
    // When: Codespace 생성 요청
    // Then: 403 Forbidden 에러 반환
  });
});

describe('CodespacesService.getCodespaceStatus', () => {
  // ✅ 성공 케이스
  test('Codespace 상태 조회 성공', async () => {
    // Given: 존재하는 Codespace
    // When: 상태 조회 요청
    // Then: Codespace 상태 정보 반환
  });

  // ❌ 실패 케이스
  test('존재하지 않는 Codespace 상태 조회 실패', async () => {
    // Given: 존재하지 않는 Codespace ID
    // When: 상태 조회 요청
    // Then: 404 Not Found 에러 반환
  });
});
```

### 4.2 배포 프로세스

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/deployment.service.test.ts`

```typescript
describe('DeploymentService.startDeployment', () => {
  // ✅ 성공 케이스
  test('Low-Code 프로젝트 배포 성공', async () => {
    // Given: Low-Code 프로젝트
    // When: 배포 시작 요청
    // Then: Cloudflare Pages 배포 시작 및 상태 반환
  });

  test('No-Code 프로젝트 배포 성공', async () => {
    // Given: No-Code 프로젝트
    // When: 배포 시작 요청
    // Then: 정적 페이지 생성 및 배포 완료
  });

  // ❌ 실패 케이스
  test('빌드 오류로 배포 실패', async () => {
    // Given: 빌드 오류가 있는 프로젝트
    // When: 배포 시작 요청
    // Then: 배포 실패 상태 및 오류 로그 반환
  });

  test('Cloudflare API 오류로 배포 실패', async () => {
    // Given: Cloudflare API 서버 오류
    // When: 배포 시작 요청
    // Then: 502 Bad Gateway 에러 반환
  });
});
```

---

## 💰 5. 수익화 기능 테스트 (Requirement 3)

### 5.1 AdSense 연동

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/revenue.service.test.ts`

```typescript
describe('RevenueService.setupAdSense', () => {
  // ✅ 성공 케이스
  test('AdSense 계정 연동 성공', async () => {
    // Given: 유효한 AdSense Publisher ID
    // When: AdSense 연동 요청
    // Then: AdSense 설정 저장 및 광고 코드 생성
  });

  test('광고 단위 생성 성공', async () => {
    // Given: 유효한 광고 단위 설정
    // When: 광고 단위 생성 요청
    // Then: 광고 단위 생성 및 코드 반환
  });

  // ❌ 실패 케이스
  test('잘못된 Publisher ID로 연동 실패', async () => {
    // Given: 유효하지 않은 Publisher ID
    // When: AdSense 연동 요청
    // Then: 400 Bad Request 에러 반환
  });

  test('AdSense API 오류로 연동 실패', async () => {
    // Given: AdSense API 서버 오류
    // When: AdSense 연동 요청
    // Then: 502 Bad Gateway 에러 반환
  });
});
```

### 5.2 수익 분석

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/revenue.service.test.ts`

```typescript
describe('RevenueService.getRevenueData', () => {
  // ✅ 성공 케이스
  test('수익 데이터 조회 성공', async () => {
    // Given: AdSense가 연동된 프로젝트
    // When: 수익 데이터 조회 요청
    // Then: 수익 통계 및 분석 데이터 반환
  });

  test('기간별 수익 데이터 조회 성공', async () => {
    // Given: 특정 기간 설정
    // When: 기간별 수익 데이터 조회 요청
    // Then: 해당 기간의 수익 데이터 반환
  });

  // ❌ 실패 케이스
  test('AdSense 미연동 프로젝트 수익 조회 실패', async () => {
    // Given: AdSense가 연동되지 않은 프로젝트
    // When: 수익 데이터 조회 요청
    // Then: 404 Not Found 에러 반환
  });
});
```

### 5.3 수익 최적화

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/revenueOptimization.service.test.ts`

```typescript
describe('RevenueOptimizationService.getRecommendations', () => {
  // ✅ 성공 케이스
  test('수익 최적화 권장사항 생성 성공', async () => {
    // Given: 수익 데이터가 있는 프로젝트
    // When: 최적화 권장사항 요청
    // Then: 개선 권장사항 목록 반환
  });

  // ❌ 실패 케이스
  test('데이터 부족으로 권장사항 생성 실패', async () => {
    // Given: 수익 데이터가 부족한 프로젝트
    // When: 최적화 권장사항 요청
    // Then: 400 Bad Request 에러 반환
  });
});
```

---

## 👥 6. 커뮤니티 기능 테스트

### 6.1 게시글 관리

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/community.service.test.ts`

```typescript
describe('CommunityService.createPost', () => {
  // ✅ 성공 케이스
  test('게시글 생성 성공', async () => {
    // Given: 유효한 게시글 데이터
    // When: 게시글 생성 요청
    // Then: 게시글 생성 및 정보 반환
  });

  test('프로젝트 연결 게시글 생성 성공', async () => {
    // Given: 프로젝트 ID가 포함된 게시글 데이터
    // When: 게시글 생성 요청
    // Then: 프로젝트 연결된 게시글 생성
  });

  // ❌ 실패 케이스
  test('필수 필드 누락으로 게시글 생성 실패', async () => {
    // Given: 제목이 누락된 게시글 데이터
    // When: 게시글 생성 요청
    // Then: 400 Bad Request 에러 반환
  });

  test('존재하지 않는 프로젝트 연결로 생성 실패', async () => {
    // Given: 존재하지 않는 프로젝트 ID
    // When: 게시글 생성 요청
    // Then: 404 Not Found 에러 반환
  });
});
```

### 6.2 댓글 및 투표 시스템

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/community.service.test.ts`

```typescript
describe('CommunityService.createComment', () => {
  // ✅ 성공 케이스
  test('댓글 생성 성공', async () => {
    // Given: 유효한 댓글 데이터
    // When: 댓글 생성 요청
    // Then: 댓글 생성 및 정보 반환
  });

  // ❌ 실패 케이스
  test('존재하지 않는 게시글에 댓글 생성 실패', async () => {
    // Given: 존재하지 않는 게시글 ID
    // When: 댓글 생성 요청
    // Then: 404 Not Found 에러 반환
  });
});

describe('CommunityService.votePost', () => {
  // ✅ 성공 케이스
  test('게시글 추천 성공', async () => {
    // Given: 유효한 게시글 ID와 추천 값
    // When: 게시글 추천 요청
    // Then: 추천 수 업데이트 및 결과 반환
  });

  // ❌ 실패 케이스
  test('중복 투표로 실패', async () => {
    // Given: 이미 투표한 게시글
    // When: 재투표 요청
    // Then: 409 Conflict 에러 반환
  });
});
```

---

## 📚 7. 템플릿 시스템 테스트 (Requirement 4)

### 7.1 템플릿 조회

#### 단위 테스트

**테스트 파일**: `packages/backend/src/services/__tests__/template.service.test.ts`

```typescript
describe('TemplateService.getTemplates', () => {
  // ✅ 성공 케이스
  test('전체 템플릿 목록 조회 성공', async () => {
    // Given: 템플릿 데이터베이스
    // When: 템플릿 목록 조회 요청
    // Then: 템플릿 목록 반환
  });

  test('카테고리별 템플릿 조회 성공', async () => {
    // Given: 특정 카테고리 필터
    // When: 카테고리별 템플릿 조회 요청
    // Then: 해당 카테고리 템플릿 목록 반환
  });

  test('난이도별 템플릿 조회 성공', async () => {
    // Given: 특정 난이도 필터
    // When: 난이도별 템플릿 조회 요청
    // Then: 해당 난이도 템플릿 목록 반환
  });

  // ❌ 실패 케이스
  test('존재하지 않는 카테고리 조회 시 빈 목록 반환', async () => {
    // Given: 존재하지 않는 카테고리
    // When: 템플릿 조회 요청
    // Then: 빈 배열 반환
  });
});

describe('TemplateService.getFeaturedTemplates', () => {
  // ✅ 성공 케이스
  test('추천 템플릿 조회 성공', async () => {
    // Given: 추천 템플릿 데이터
    // When: 추천 템플릿 조회 요청
    // Then: 추천 템플릿 목록 반환
  });
});
```

---

## 🧪 8. Frontend 컴포넌트 테스트

### 8.1 인증 컴포넌트

#### 단위 테스트

**테스트 파일**: `packages/frontend/src/components/auth/__tests__/AuthProvider.test.tsx`

```typescript
describe('AuthProvider', () => {
  // ✅ 성공 케이스
  test('로그인 상태 관리 성공', () => {
    // Given: AuthProvider로 감싸진 컴포넌트
    // When: 로그인 액션 실행
    // Then: 인증 상태 업데이트 및 토큰 저장
  });

  test('로그아웃 처리 성공', () => {
    // Given: 로그인된 상태
    // When: 로그아웃 액션 실행
    // Then: 인증 상태 초기화 및 토큰 제거
  });

  // ❌ 실패 케이스
  test('만료된 토큰으로 자동 로그아웃', () => {
    // Given: 만료된 JWT 토큰
    // When: 컴포넌트 마운트
    // Then: 자동 로그아웃 처리
  });
});
```

### 8.2 프로젝트 관리 컴포넌트

#### 단위 테스트

**테스트 파일**: `packages/frontend/src/components/projects/__tests__/CreateProjectModal.test.tsx`

```typescript
describe('CreateProjectModal', () => {
  // ✅ 성공 케이스
  test('프로젝트 생성 폼 제출 성공', () => {
    // Given: 유효한 프로젝트 정보 입력
    // When: 폼 제출
    // Then: 프로젝트 생성 API 호출 및 모달 닫기
  });

  test('템플릿 선택 기능 동작', () => {
    // Given: 템플릿 목록
    // When: 템플릿 선택
    // Then: 선택된 템플릿 정보 폼에 반영
  });

  // ❌ 실패 케이스
  test('필수 필드 누락 시 유효성 검사 오류 표시', () => {
    // Given: 프로젝트 이름 미입력
    // When: 폼 제출 시도
    // Then: 유효성 검사 오류 메시지 표시
  });
});
```

### 8.3 커스텀 훅 테스트

#### 단위 테스트

**테스트 파일**: `packages/frontend/src/hooks/__tests__/useAuth.test.ts`

```typescript
describe('useAuth', () => {
  // ✅ 성공 케이스
  test('로그인 기능 동작', async () => {
    // Given: useAuth 훅 사용
    // When: login 함수 호출
    // Then: API 호출 및 상태 업데이트
  });

  test('사용자 정보 로딩 상태 관리', () => {
    // Given: useAuth 훅 사용
    // When: 사용자 정보 로딩 중
    // Then: isLoading 상태 true 반환
  });

  // ❌ 실패 케이스
  test('로그인 실패 시 에러 상태 관리', async () => {
    // Given: 잘못된 로그인 정보
    // When: login 함수 호출
    // Then: error 상태에 오류 메시지 설정
  });
});
```

---

## 🔄 9. E2E (End-to-End) 테스트

### 9.1 사용자 워크플로우 테스트

#### 전체 워크플로우 테스트

**테스트 파일**: `packages/frontend/src/__tests__/e2e/user-workflow.test.ts`

```typescript
describe('사용자 전체 워크플로우', () => {
  // ✅ 성공 시나리오
  test('회원가입부터 프로젝트 배포까지 전체 플로우', async () => {
    // 1. 회원가입
    // 2. 로그인
    // 3. 프로젝트 생성
    // 4. AI 모델 연동
    // 5. 프로젝트 배포
    // 6. 수익화 설정
    // 7. 커뮤니티 게시글 작성
  });

  test('No-Code 프로젝트 생성 및 배포 플로우', async () => {
    // 1. 로그인
    // 2. No-Code 프로젝트 생성
    // 3. 페이지 콘텐츠 편집
    // 4. 프로젝트 배포
    // 5. 배포 결과 확인
  });

  // ❌ 실패 시나리오
  test('권한 없는 사용자의 프로젝트 접근 차단', async () => {
    // 1. 사용자 A 로그인 및 프로젝트 생성
    // 2. 사용자 B 로그인
    // 3. 사용자 A의 프로젝트 접근 시도
    // 4. 접근 거부 확인
  });
});
```

---

## 📈 10. 성능 테스트

### 10.1 API 성능 테스트

**테스트 파일**: `packages/backend/src/__tests__/performance/api.performance.test.ts`

```typescript
describe('API 성능 테스트', () => {
  test('프로젝트 목록 조회 성능', async () => {
    // Given: 1000개의 프로젝트 데이터
    // When: GET /api/projects 호출
    // Then: 응답 시간 < 500ms
  });

  test('동시 사용자 로그인 처리 성능', async () => {
    // Given: 100명의 동시 로그인 요청
    // When: POST /api/auth/login 동시 호출
    // Then: 모든 요청 처리 시간 < 2초
  });

  test('대용량 파일 업로드 성능', async () => {
    // Given: 5MB 이미지 파일
    // When: 파일 업로드 요청
    // Then: 업로드 시간 < 10초
  });
});
```

---

## 🛡️ 11. 보안 테스트

### 11.1 인증 보안 테스트

**테스트 파일**: `packages/backend/src/__tests__/security/auth.security.test.ts`

```typescript
describe('인증 보안 테스트', () => {
  // ✅ 보안 검증
  test('JWT 토큰 변조 감지', async () => {
    // Given: 변조된 JWT 토큰
    // When: 인증이 필요한 API 호출
    // Then: 401 Unauthorized 반환
  });

  test('SQL Injection 방어', async () => {
    // Given: SQL Injection 시도 데이터
    // When: 로그인 API 호출
    // Then: 안전하게 처리되고 인증 실패
  });

  test('XSS 공격 방어', async () => {
    // Given: 스크립트 태그가 포함된 데이터
    // When: 게시글 생성 API 호출
    // Then: 스크립트 태그 이스케이프 처리
  });

  test('CSRF 공격 방어', async () => {
    // Given: 잘못된 Origin 헤더
    // When: 상태 변경 API 호출
    // Then: 403 Forbidden 반환
  });
});
```

---

## 📊 테스트 실행 가이드

### 테스트 실행 명령어

```bash
# 전체 테스트 실행
npm run test

# 백엔드 테스트만 실행
npm run test:backend

# 프론트엔드 테스트만 실행
npm run test:frontend

# 특정 테스트 파일 실행
npm run test -- auth.service.test.ts

# 커버리지 포함 테스트 실행
npm run test:coverage

# E2E 테스트 실행
npm run test:e2e

# 성능 테스트 실행
npm run test:performance
```

### 테스트 환경 설정

```bash
# 테스트 데이터베이스 설정
npm run test:db:setup

# 테스트 데이터 시딩
npm run test:db:seed

# 테스트 환경 정리
npm run test:cleanup
```

---

## 🎯 테스트 완료 기준

### 단위 테스트
- [ ] 모든 서비스 함수 테스트 커버리지 90% 이상
- [ ] 모든 컨트롤러 메소드 테스트 작성
- [ ] 모든 커스텀 훅 테스트 작성
- [ ] 모든 유틸리티 함수 테스트 작성

### 통합 테스트
- [ ] 모든 API 엔드포인트 테스트 작성
- [ ] 데이터베이스 연동 테스트 작성
- [ ] 외부 서비스 연동 테스트 작성

### E2E 테스트
- [ ] 주요 사용자 워크플로우 테스트 작성
- [ ] 크로스 브라우저 테스트 완료
- [ ] 모바일 반응형 테스트 완료

### 성능 테스트
- [ ] API 응답 시간 기준 충족
- [ ] 동시 사용자 처리 성능 검증
- [ ] 메모리 사용량 최적화 확인

### 보안 테스트
- [ ] 인증/인가 보안 검증
- [ ] 입력 데이터 검증 테스트
- [ ] 일반적인 웹 취약점 방어 확인

---

## 📝 테스트 리포팅

테스트 실행 결과는 다음 형태로 리포팅됩니다:

```
AI Service Platform Test Report
===============================

📊 전체 테스트 결과:
- 총 테스트: 146개
- 통과: 0개 (0%)
- 실패: 0개 (0%)
- 건너뜀: 146개 (100%)

📈 커버리지:
- 라인 커버리지: 0%
- 함수 커버리지: 0%
- 브랜치 커버리지: 0%

⏱️ 실행 시간: 0초

🎯 다음 단계: 테스트 구현 시작
```

이 테스트 시나리오 문서를 기반으로 체계적인 테스트 구현을 진행할 수 있습니다.