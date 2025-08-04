# 리팩토링 로그

이 문서는 프로젝트의 주요 구조적 변경 사항을 기록하고, 다른 개발자나 AI가 변경 사항을 쉽게 이해할 수 있도록 돕기 위해 작성되었습니다.

## 2025-08-04: 백엔드 DI(의존성 주입) 리팩토링

### 요약

백엔드 서비스 및 컨트롤러의 전체적인 구조를 개선하기 위해 의존성 주입(Dependency Injection) 패턴을 도입했습니다. 이를 통해 코드의 모듈화, 테스트 용이성, 유지보수성을 향상시켰습니다.

### 기술 스택 변경

* **`tsyringe`**: 경량 의존성 주입 컨테이너 라이브러리를 추가했습니다.
* **`reflect-metadata`**: `tsyringe`가 타입 메타데이터를 사용하기 위해 필요한 라이브러리를 추가했습니다.
* **`@octokit/rest`**: GitHub Codespaces와 상호작용하기 위한 Octokit 라이브러리를 추가했습니다.

### 주요 변경 사항

1. **서비스 및 컨트롤러 클래스 수정**:
    * 기존에 `static` 메소드로만 구성되었던 모든 서비스와 컨트롤러 클래스를 인스턴스화하여 사용할 수 있도록 변경했습니다.
    * 각 클래스에 `@injectable()` 데코레이터를 추가하여 DI 컨테이너가 관리할 수 있도록 했습니다.

2. **의존성 주입 적용**:
    * 컨트롤러가 생성자(constructor)를 통해 필요한 서비스를 주입받도록 수정했습니다.
        * `AuthController` -> `AuthService`
        * `OAuthController` -> `OAuthService`
        * `ProjectController` -> `ProjectService`
        * `AIModelController` -> `AIModelService`
    * `ProjectService`는 `CodespacesService`에 의존하므로, 이를 주입받도록 수정했습니다.

3. **라우팅 시스템 업데이트**:
    * 각 라우트 파일(`auth.routes.ts`, `project.routes.ts`)에서 DI 컨테이너(`tsyringe.container`)를 사용하여 컨트롤러 인스턴스를 `resolve`하도록 변경했습니다.
    * 이를 통해 라우트가 싱글톤으로 관리되는 컨트롤러 인스턴스를 사용하게 됩니다.

4. **`tsconfig.json` 수정**:
    * 모노레포 구조에서 `packages/shared`에 있는 파일을 `packages/backend`에서 올바르게 참조할 수 있도록 `baseUrl`과 `paths`를 수정했습니다.
    * `@shared/*` 경로 별칭을 추가하여 `../shared/src/*`를 가리키도록 설정했습니다.

5. **애플리케이션 진입점(`index.ts`) 정리**:
    * 기존에 있던 모든 모의(mock) API 엔드포인트를 제거했습니다.
    * 리팩토링된 `authRoutes`와 새로 생성된 `projectRoutes`를 사용하도록 `app.use()`를 업데이트했습니다.
    * 전역 오류 처리 미들웨어를 추가하여 애플리케이션 전반의 오류를 일관되게 처리하도록 개선했습니다.

### 기대 효과

* **결합도 감소 (Decoupling)**: 컴포넌트 간의 의존성이 낮아져, 한 부분의 변경이 다른 부분에 미치는 영향을 최소화합니다.
* **테스트 용이성 향상**: 단위 테스트 시, 실제 의존성 대신 모의(mock) 객체를 쉽게 주입할 수 있어 격리된 테스트가 용이해집니다.
* **코드 가독성 및 유지보수성 향상**: 각 클래스의 책임이 명확해지고, 코드의 흐름을 파악하기 쉬워집니다.

## 2025-08-04: "No-Code" 기능 구현

### 요약

사용자가 코딩 없이 웹 UI를 통해 단일 페이지 웹사이트를 생성하고 배포할 수 있는 "No-Code" 기능을 도입했습니다. 이는 플랫폼의 핵심 목표인 "아이디어를 1페이지로 만들어 배포까지"를 더욱 직관적으로 구현합니다.

### 주요 변경 사항

1. **데이터 모델 확장 (`packages/backend/prisma/schema.prisma`)**:
    * `Project` 모델에 `projectType` (LOW_CODE/NO_CODE 구분) 필드와 `pageContent` (No-Code 페이지 내용 JSON) 필드를 추가했습니다.
    * Prisma 버전 업데이트 및 클라이언트 재생성을 통해 스키마 변경 사항을 데이터베이스에 반영했습니다.

2. **백엔드 서비스 로직 업데이트**:
    * **`ProjectService` (`packages/backend/src/services/project.service.ts`)**:
        * `createProject`, `getProjectById`, `updateProject` 메소드를 수정하여 `projectType` 및 `pageContent` 필드를 처리하도록 했습니다.
        * `pageContent` 필드는 데이터베이스에 JSON 문자열로 저장되고, 조회 시 객체로 파싱됩니다.
        * Prisma의 타입 추론 문제로 인해 `Project` 인터페이스를 수동으로 정의하여 타입 안정성을 확보했습니다.
    * **`DeploymentService` (`packages/backend/src/services/deployment.service.ts`)**:
        * `startDeployment` 메소드에 `projectType`에 따른 배포 로직 분기점을 추가했습니다.
        * 'NO_CODE' 프로젝트의 경우, 새로운 정적 페이지 생성 유틸리티를 호출하여 HTML을 생성하고 배포를 시뮬레이션합니다.
        * 'LOW_CODE' 프로젝트의 경우, 기존 Codespaces 기반 배포 로직을 유지합니다.
        * `DeploymentRecord` 인터페이스를 명확히 정의하고, 로그 엔트리(`LogEntry`) 타입을 추가하여 타입 안정성을 높였습니다.

3. **백엔드 컨트롤러 및 라우트 업데이트**:
    * **`ProjectController` (`packages/backend/src/controllers/project.controller.ts`)**:
        * `createProject` 및 `updateProject` 메소드가 `projectType` 및 `pageContent` 필드를 처리할 수 있도록 업데이트했습니다.
        * `updatePageContent`라는 새로운 메소드를 추가하여 프로젝트의 `pageContent`만 독립적으로 업데이트할 수 있도록 했습니다.
    * **`Project Routes` (`packages/backend/src/routes/project.routes.ts`)**:
        * `PUT /projects/:id/page-content` 라우트를 추가하여 `updatePageContent` 메소드와 연결했습니다.

4. **정적 페이지 생성 유틸리티 (`packages/backend/src/utils/static-page-generator.ts`)**:
    * 새로운 유틸리티 파일을 생성하여 JSON 형식의 페이지 콘텐츠(title, heading, body, imageUrl 등)를 입력받아 간단한 HTML 페이지 문자열을 생성하는 함수를 구현했습니다.

5. **프론트엔드 통합**:
    * **스키마 및 타입 정의 (`packages/frontend/src/lib/schemas.ts`, `packages/frontend/src/types/index.ts`)**:
        * 프론트엔드의 `createProjectSchema`, `updateProjectSchema`에 `projectType` 및 `pageContent` 필드를 추가했습니다.
        * `updatePageContentSchema`를 새로 정의하고, `UpdatePageContentInput` 타입을 추가했습니다.
        * `Project` 인터페이스(`types/index.ts`)를 백엔드의 `Project` 모델과 완벽하게 일치하도록 업데이트했으며, `AIModelConfig` 및 `DeploymentRecordFrontend`와 같은 관련 타입들도 정렬했습니다.
    * **No-Code 에디터 컴포넌트 (`packages/frontend/src/components/projects/NoCodeEditor.tsx`)**:
        * 사용자가 페이지 콘텐츠(제목, 본문, 이미지 URL 등)를 입력할 수 있는 React 기반의 UI 컴포넌트를 구현했습니다.
        * `react-hook-form`과 `zod`를 사용하여 폼 관리 및 유효성 검사를 처리합니다.
    * **프로젝트 상세 페이지 통합 (`packages/frontend/src/pages/projects/[id].tsx`)**:
        * `NoCodeEditor` 컴포넌트를 임포트하고, `currentProject.projectType` 값에 따라 기존의 "Low-Code" 관련 UI(Codespace 상태, AI 모델 설정, 배포 상태) 또는 새로운 "No-Code" 에디터가 표시되도록 조건부 렌더링을 구현했습니다.
        * 에디터의 저장 버튼은 백엔드의 `updatePageContent` API를 호출하여 변경 사항을 저장하도록 연결했습니다.
    * **API 클라이언트 함수 (`packages/frontend/src/services/api/projects.ts`)**:
        * `updateProjectPageContent` 함수를 추가하여 프론트엔드에서 백엔드의 `PUT /projects/:id/page-content` 엔드포인트와 통신할 수 있도록 했습니다.

### 기대 효과

* **진정한 "No-Code" 경험**: 코딩 지식 없이도 웹 페이지 콘텐츠를 직접 편집하고 배포할 수 있는 기능을 제공하여 사용자 접근성을 극대화합니다.
* **유연한 프로젝트 타입**: 사용자가 프로젝트 생성 시 'Low-Code' (Codespaces 기반)와 'No-Code' 방식 중 선택할 수 있도록 하여 다양한 요구사항을 충족합니다.
* **단순화된 배포 프로세스**: 'No-Code' 프로젝트의 경우 복잡한 개발 환경 설정 없이 바로 정적 페이지 배포가 가능해집니다.
* **모듈화된 코드**: 프론트엔드와 백엔드 모두 새로운 기능에 맞춰 깔끔하게 확장되어 유지보수성이 더욱 향상되었습니다.
