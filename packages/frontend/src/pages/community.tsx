import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import { CommunityForum } from '../components/community/CommunityForum';

const CommunityPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Community - AI Service Platform</title>
        <meta name="description" content="Connect with other AI service creators and share knowledge" />
      </Head>

      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Community Forum</h1>
            <p className="text-gray-600">
              Connect with other creators, share your projects, and get help from the community.
            </p>
          </div>

          <CommunityForum />
        </div>
      </Layout>
    </>
  );
};

export default CommunityPage;