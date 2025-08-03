#!/bin/bash

echo "🚀 AI Service Platform 데모 실행"
echo "=================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 프론트엔드 실행 중...${NC}"

# 프론트엔드 디렉토리로 이동하여 실행
cd packages/frontend

# 기본 의존성만 설치
echo -e "${YELLOW}⚠️  기본 의존성 설치 중...${NC}"
npm install next react react-dom typescript @types/react @types/node tailwindcss postcss autoprefixer

# 개발 서버 시작
echo -e "${GREEN}✅ 프론트엔드 서버 시작!${NC}"
echo ""
echo -e "${BLUE}🌐 접속 정보:${NC}"
echo -e "  • 메인 페이지: ${GREEN}http://localhost:3000${NC}"
echo -e "  • 컴포넌트 테스트: ${GREEN}http://localhost:3000/test${NC}"
echo ""
echo -e "${YELLOW}💡 팁: 컴포넌트 테스트 페이지에서 모든 기능을 확인할 수 있습니다!${NC}"
echo ""

npm run dev