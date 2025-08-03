#!/bin/bash

echo "🚀 AI Service Platform 개발 서버 시작"
echo "=================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 필요한 디렉토리 생성
echo -e "${BLUE}📁 필요한 디렉토리 생성 중...${NC}"
mkdir -p packages/backend/dist
mkdir -p packages/frontend/.next

# 의존성 설치 확인
echo -e "${BLUE}📦 의존성 설치 확인 중...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  루트 의존성 설치 중...${NC}"
    npm install
fi

if [ ! -d "packages/backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  백엔드 의존성 설치 중...${NC}"
    cd packages/backend && npm install && cd ../..
fi

if [ ! -d "packages/frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  프론트엔드 의존성 설치 중...${NC}"
    cd packages/frontend && npm install && cd ../..
fi

# 환경 변수 파일 확인
echo -e "${BLUE}🔧 환경 변수 확인 중...${NC}"
if [ ! -f "packages/backend/.env" ]; then
    echo -e "${YELLOW}⚠️  백엔드 .env 파일이 없습니다. .env.example을 복사합니다.${NC}"
    cp packages/backend/.env.example packages/backend/.env
fi

if [ ! -f "packages/frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠️  프론트엔드 .env.local 파일을 생성합니다.${NC}"
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > packages/frontend/.env.local
    echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> packages/frontend/.env.local
fi

# 데이터베이스 설정 (개발용 SQLite 사용)
echo -e "${BLUE}🗄️  데이터베이스 설정 중...${NC}"
if [ ! -f "packages/backend/dev.db" ]; then
    echo -e "${YELLOW}⚠️  개발용 SQLite 데이터베이스를 생성합니다.${NC}"
    # SQLite를 사용하도록 DATABASE_URL 수정
    sed -i.bak 's|DATABASE_URL="postgresql://.*"|DATABASE_URL="file:./dev.db"|' packages/backend/.env
fi

# Prisma 설정
echo -e "${BLUE}🔄 Prisma 설정 중...${NC}"
cd packages/backend
if [ ! -d "node_modules/.prisma" ]; then
    echo -e "${YELLOW}⚠️  Prisma 클라이언트 생성 중...${NC}"
    npx prisma generate
fi

# 데이터베이스 마이그레이션
echo -e "${YELLOW}⚠️  데이터베이스 마이그레이션 실행 중...${NC}"
npx prisma db push --accept-data-loss

cd ../..

echo -e "${GREEN}✅ 설정 완료!${NC}"
echo ""
echo -e "${BLUE}🌐 서버 정보:${NC}"
echo -e "  • 프론트엔드: ${GREEN}http://localhost:3000${NC}"
echo -e "  • 백엔드 API: ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${BLUE}🚀 개발 서버를 시작합니다...${NC}"
echo ""

# 개발 서버 시작
npm run dev