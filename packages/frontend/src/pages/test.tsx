import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'pending'>>({});

  const testAccounts = [
    {
      role: 'Admin',
      email: 'admin@aiplatform.com',
      password: 'admin123!',
      description: '관리자 계정 - 모든 기능 접근 가능'
    },
    {
      role: 'Demo User',
      email: 'demo@example.com',
      password: 'demo123!',
      description: '일반 사용자 계정 - 샘플 프로젝트 포함'
    }
  ];

  const pageTests = [
    {
      category: '인증 페이지',
      pages: [
        { name: '로그인', path: '/auth/login', description: '사용자 로그인' },
        { name: '회원가입', path: '/auth/register', description: '새 계정 생성' },
      ]
    },
    {
      category: '메인 페이지',
      pages: [
        { name: '홈페이지', path: '/', description: '랜딩 페이지' },
        { name: '대시보드', path: '/dashboard', description: '사용자 대시보드' },
      ]
    },
    {
      category: '프로젝트 관리',
      pages: [
        { name: '프로젝트 목록', path: '/projects', description: '프로젝트 목록 및 관리' },
        { name: '새 프로젝트', path: '/projects/new', description: '새 프로젝트 생성' },
        { name: '프로젝트 상세', path: '/projects/1', description: '프로젝트 상세 정보' },
        { name: 'AI 모델 연동', path: '/projects/1/ai-model', description: 'AI 모델 설정' },
        { name: '배포 관리', path: '/projects/1/deploy', description: '프로젝트 배포' },
      ]
    },
    {
      category: '템플릿 & 커뮤니티',
      pages: [
        { name: '템플릿 라이브러리', path: '/templates', description: '템플릿 브라우징' },
        { name: '성공 사례', path: '/success-stories', description: '성공 사례 모음' },
        { name: '커뮤니티 포럼', path: '/community', description: '커뮤니티 게시판' },
        { name: '프로젝트 갤러리', path: '/community/projects', description: '공유 프로젝트' },
      ]
    },
    {
      category: '수익화',
      pages: [
        { name: '수익 대시보드', path: '/revenue', description: '수익 현황 및 분석' },
        { name: 'AdSense 설정', path: '/revenue/adsense', description: 'AdSense 연동' },
      ]
    },
    {
      category: '관리자 (Admin 계정 필요)',
      pages: [
        { name: '관리자 대시보드', path: '/admin', description: '플랫폼 관리' },
        { name: '사용자 관리', path: '/admin/users', description: '사용자 관리' },
        { name: '시스템 모니터링', path: '/admin/system', description: '시스템 상태' },
      ]
    }
  ];

  const testAPI = async (endpoint: string) => {
    setTestResults(prev => ({ ...prev, [endpoint]: 'pending' }));
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`);
      const data = await response.json();
      console.log(`API Test ${endpoint}:`, data);
      setTestResults(prev => ({ 
        ...prev, 
        [endpoint]: response.ok ? 'success' : 'error' 
      }));
    } catch (error) {
      console.error(`API Test ${endpoint} Error:`, error);
      setTestResults(prev => ({ ...prev, [endpoint]: 'error' }));
    }
  };

  const apiEndpoints = [
    { name: '헬스체크', endpoint: '/health' },
    { name: '사용자 목록', endpoint: '/api/users' },
    { name: '프로젝트 목록', endpoint: '/api/projects' },
    { name: '템플릿 목록', endpoint: '/api/templates' },
    { name: '커뮤니티 게시글', endpoint: '/api/community/posts' },
  ];

  const getStatusBadge = (status?: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">✓ 성공</Badge>;
      case 'error':
        return <Badge className="bg-red-500">✗ 실패</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">⏳ 테스트 중</Badge>;
      default:
        return <Badge variant="outline">미테스트</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI 서비스 플랫폼 테스트 페이지</h1>
        <p className="text-gray-600">
          구현된 모든 기능을 테스트할 수 있는 통합 테스트 페이지입니다.
        </p>
      </div>

      {/* 테스트 계정 정보 */}
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">🔑 테스트 계정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testAccounts.map((account, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-lg mb-2">{account.role}</h3>
              <div className="space-y-1 text-sm">
                <p><strong>이메일:</strong> <code className="bg-white px-2 py-1 rounded">{account.email}</code></p>
                <p><strong>비밀번호:</strong> <code className="bg-white px-2 py-1 rounded">{account.password}</code></p>
                <p className="text-gray-600">{account.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 페이지 테스트 */}
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">📄 페이지 테스트</h2>
        <div className="space-y-6">
          {pageTests.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h3 className="text-lg font-semibold mb-3 text-blue-600">{category.category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.pages.map((page, pageIndex) => (
                  <div key={pageIndex} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{page.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {page.path}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{page.description}</p>
                    <Link href={page.path}>
                      <Button size="sm" className="w-full">
                        페이지 열기
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* API 테스트 */}
      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">🔌 API 테스트</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apiEndpoints.map((api, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{api.name}</h3>
                {getStatusBadge(testResults[api.endpoint])}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                <code>{api.endpoint}</code>
              </p>
              <Button 
                size="sm" 
                onClick={() => testAPI(api.endpoint)}
                disabled={testResults[api.endpoint] === 'pending'}
                className="w-full"
              >
                {testResults[api.endpoint] === 'pending' ? '테스트 중...' : 'API 테스트'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* 기능별 테스트 가이드 */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">📋 테스트 가이드</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold mb-2">1. 기본 기능 테스트</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 회원가입 → 로그인 → 대시보드 접근</li>
              <li>• 새 프로젝트 생성 → AI 모델 연동 → 배포 설정</li>
              <li>• 템플릿 선택 → 프로젝트 생성 → 커스터마이징</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold mb-2">2. 커뮤니티 기능 테스트</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 게시글 작성 → 댓글 달기 → 투표하기</li>
              <li>• 프로젝트 공유 → 평가 받기</li>
              <li>• 다른 사용자 프로젝트 둘러보기</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold mb-2">3. 수익화 기능 테스트</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• AdSense 계정 연동 (테스트 모드)</li>
              <li>• 수익 대시보드 확인</li>
              <li>• 광고 설정 및 최적화</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold mb-2">4. 관리자 기능 테스트 (Admin 계정)</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 플랫폼 통계 확인</li>
              <li>• 사용자 관리 및 지원</li>
              <li>• 시스템 모니터링</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TestPage;