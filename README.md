# 🚀 AI Service Platform

AI 모델을 활용한 웹 애플리케이션 생성, 배포, 수익화 통합 플랫폼

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13+-black.svg)](https://nextjs.org/)

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [API 문서](#api-문서)
- [배포](#배포)
- [기여하기](#기여하기)
- [라이선스](#라이선스)

## 🎯 개요

AI Service Platform은 개발자들이 AI 모델을 쉽게 웹 애플리케이션으로 변환하고, 배포하며, 수익화할 수 있도록 도와주는 통합 플랫폼입니다. Teachable Machine, Hugging Face 등의 AI 모델을 활용하여 누구나 쉽게 AI 서비스를 만들 수 있습니다.

### ✨ 핵심 가치

- **🎨 간편한 AI 서비스 생성**: 코딩 지식 없이도 AI 모델을 웹 서비스로 변환
- **☁️ 클라우드 개발 환경**: GitHub Codespaces를 통한 즉시 개발 환경 제공
- **🚀 원클릭 배포**: Cloudflare Pages를 통한 빠른 배포
- **💰 수익화 지원**: AdSense 연동을 통한 자동 수익화
- **👥 커뮤니티**: 개발자들 간의 지식 공유 및 협업

## 🌟 주요 기능

### 🔧 AI 모델 연동
- **Teachable Machine** 모델 직접 연동
- **Hugging Face** 모델 지원
- **Custom API** 연동 가능
- 실시간 모델 테스트 인터페이스

### 🏗️ 프로젝트 관리
- 직관적인 프로젝트 대시보드
- 템플릿 기반 빠른 시작
- 버전 관리 및 협업 도구
- 실시간 개발 환경 (GitHub Codespaces)

### 🚀 배포 및 호스팅
- **Cloudflare Pages** 자동 배포
- 커스텀 도메인 지원
- SSL 인증서 자동 설정
- 글로벌 CDN 배포

### 💰 수익화 도구
- **Google AdSense** 자동 연동
- 수익 분석 대시보드
- A/B 테스트 지원
- 수익 최적화 권장사항

### 👥 커뮤니티 기능
- 프로젝트 공유 및 피드백
- Q&A 포럼
- 성공 사례 공유
- 개발자 네트워킹

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **UI Components**: Custom UI Library
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (개발) / PostgreSQL (프로덕션)
- **ORM**: Prisma
- **Authentication**: JWT + OAuth 2.0
- **File Upload**: Multer

### DevOps & Deployment
- **Development**: GitHub Codespaces
- **Deployment**: Cloudflare Pages
- **Database**: Supabase / Railway
- **Monitoring**: Built-in Analytics
- **CI/CD**: GitHub Actions

### External APIs
- **AI Models**: Teachable Machine, Hugging Face
- **Authentication**: Google OAuth, GitHub OAuth
- **Monetization**: Google AdSense
- **Cloud Storage**: Cloudflare R2

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 9.0.0 이상
- Git

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/yourusername/ai-service-platform.git
   cd ai-service-platform
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   # Backend 환경 변수
   cp packages/backend/.env.example packages/backend/.env
   
   # Frontend 환경 변수
   cp packages/frontend/.env.local.example packages/frontend/.env.local
   ```

4. **데이터베이스 설정**

   기본적으로 개발 환경에서는 PostgreSQL을 사용하도록 설정되어 있습니다. 로컬에서 PostgreSQL을 사용하지 않고 SQLite로 간단하게 테스트하려면, `packages/backend/.env` 파일을 열어 `DATABASE_URL`을 다음과 같이 수정하세요.

   ```env
   # DATABASE_URL="postgresql://user:password@host:port/db"
   DATABASE_URL="file:./dev.db"
   ```

   이제 다음 명령어를 실행하여 데이터베이스를 설정합니다.

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. **브라우저에서 확인**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### 🧪 테스트 계정

개발 환경에서 다음 테스트 계정을 사용할 수 있습니다:

- **관리자**: `admin@aiplatform.com` / `admin123!`
- **일반 사용자**: `demo@example.com` / `demo123!`

## 📁 프로젝트 구조

```
ai-service-platform/
├── packages/
│   ├── frontend/          # Next.js 프론트엔드
│   │   ├── src/
│   │   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   │   ├── hooks/         # 커스텀 React 훅
│   │   │   ├── pages/         # Next.js 페이지
│   │   │   ├── services/      # API 서비스
│   │   │   ├── store/         # Redux 상태 관리
│   │   │   ├── lib/           # 유틸리티 함수
│   │   │   └── styles/        # 스타일 파일
│   │   └── public/            # 정적 파일
│   ├── backend/           # Express.js 백엔드
│   │   ├── src/
│   │   │   ├── controllers/   # API 컨트롤러
│   │   │   ├── services/      # 비즈니스 로직
│   │   │   ├── routes/        # API 라우트
│   │   │   ├── middleware/    # Express 미들웨어
│   │   │   ├── utils/         # 유틸리티 함수
│   │   │   └── lib/           # 라이브러리 설정
│   │   └── prisma/            # 데이터베이스 스키마
│   └── shared/            # 공유 타입 및 유틸리티
├── docs/                  # 문서
├── .kiro/                # 프로젝트 스펙 및 설계 문서
│   ├── specs/            # 기능 스펙 문서
│   └── steering/         # AI 개발 가이드라인
└── ChangeLog.md          # 변경 이력
```

## 📚 API 문서

### 인증 API
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/auth/profile` - 사용자 프로필 조회

### 프로젝트 API
- `GET /api/projects` - 프로젝트 목록 조회
- `POST /api/projects` - 새 프로젝트 생성
- `GET /api/projects/:id` - 프로젝트 상세 조회
- `PUT /api/projects/:id` - 프로젝트 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제

### 템플릿 API
- `GET /api/templates` - 템플릿 목록 조회
- `GET /api/templates/featured` - 추천 템플릿 조회
- `GET /api/templates/:id` - 템플릿 상세 조회

### 배포 API
- `POST /api/deploy/:projectId` - 프로젝트 배포
- `GET /api/deploy/:projectId/status` - 배포 상태 조회
- `GET /api/deploy/:projectId/logs` - 배포 로그 조회

## 🚀 배포

### 개발 환경
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
npm run start
```

### Docker 배포
```bash
docker-compose up -d
```

### Cloudflare Pages 배포
1. GitHub 저장소를 Cloudflare Pages에 연결
2. 빌드 설정:
   - Build command: `npm run build`
   - Build output directory: `packages/frontend/.next`
3. 환경 변수 설정
4. 자동 배포 활성화

## 🤝 기여하기

프로젝트에 기여해주셔서 감사합니다! 다음 단계를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 개발 가이드라인

- **TypeScript 우선**: 전체 스택에서 타입 안정성 확보
- **Steering Rules 준수**: `.kiro/steering/` 문서의 가이드라인 따름
- **컴포넌트 재사용성**: 작고 재사용 가능한 컴포넌트 설계
- **Hook 기반 로직**: 비즈니스 로직을 커스텀 훅으로 추상화
- **API RESTful 설계**: 일관된 API 엔드포인트 구조
- **의존성 주입**: TSyringe를 활용한 모듈화된 백엔드 구조
- **테스트 주도 개발**: Jest를 활용한 단위 테스트 작성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- [Teachable Machine](https://teachablemachine.withgoogle.com/) - AI 모델 학습 플랫폼
- [Hugging Face](https://huggingface.co/) - AI 모델 허브
- [Cloudflare](https://cloudflare.com/) - 배포 및 CDN 서비스
- [GitHub](https://github.com/) - 코드 호스팅 및 Codespaces

## 📞 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 언제든 연락주세요:

- 이슈 트래커: [GitHub Issues](https://github.com/yourusername/ai-service-platform/issues)
- 이메일: nouvell7@gmail.com
---

⭐ 이 프로젝트가 도움이 되셨다면 스타를 눌러주세요!
