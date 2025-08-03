import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { RevenueDashboard } from '../components/revenue/RevenueDashboard';

const RevenuePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Revenue - AI Service Platform</title>
        <meta name="description" content="Monitor and optimize your AI service revenue" />
      </Head>

      <ProtectedRoute>
        <Layout showSidebar>
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Track your earnings and optimize your monetization strategy.
              </p>
            </div>

            <RevenueDashboard projectId="demo-project" />
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default RevenuePage;