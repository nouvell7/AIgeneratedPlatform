import { useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import { TemplateBrowser } from '../components/templates/TemplateBrowser';
import { useAppSelector, useAppDispatch } from '../store';
import { fetchTemplates } from '../store/slices/templateSlice';

const TemplatesPage: NextPage = () => {
  const dispatch = useAppDispatch();
  const { templates, isLoading } = useAppSelector((state) => state.templates);

  useEffect(() => {
    dispatch(fetchTemplates());
  }, [dispatch]);

  return (
    <>
      <Head>
        <title>Templates - AI Service Platform</title>
        <meta name="description" content="Browse AI service templates to get started quickly" />
      </Head>

      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Template Library</h1>
            <p className="text-gray-600">
              Choose from our collection of pre-built AI service templates to get started quickly.
            </p>
          </div>

          <TemplateBrowser />
        </div>
      </Layout>
    </>
  );
};

export default TemplatesPage;