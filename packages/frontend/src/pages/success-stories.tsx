import { useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import { SuccessStories } from '../components/templates/SuccessStories';

const SuccessStoriesPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Success Stories - AI Service Platform</title>
        <meta name="description" content="Learn from successful AI service creators and their revenue stories" />
      </Head>

      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h1>
            <p className="text-gray-600">
              Discover how creators are building successful AI services and generating revenue.
            </p>
          </div>

          <SuccessStories />
        </div>
      </Layout>
    </>
  );
};

export default SuccessStoriesPage;