import { NextPage } from 'next';
import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

const AdminPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-600 mt-2">시스템 관리 및 모니터링</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                <Button
                  variant={activeTab === 'overview' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('overview')}
                >
                  개요
                </Button>
                <Button
                  variant={activeTab === 'users' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
                >
                  사용자 관리
                </Button>
                <Button
                  variant={activeTab === 'projects' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('projects')}
                >
                  프로젝트 관리
                </Button>
                <Button
                  variant={activeTab === 'system' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('system')}
                >
                  시스템 모니터링
                </Button>
              </nav>
            </Card>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  관리자 기능 개발 중
                </h2>
                <p className="text-gray-600">
                  현재 탭: {activeTab}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;