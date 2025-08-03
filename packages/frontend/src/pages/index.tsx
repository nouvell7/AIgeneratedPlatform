import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/layout/Layout';

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI Service Platform - Build and Monetize AI Services</title>
        <meta name="description" content="Create, deploy, and monetize AI services with ease" />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
          {/* Hero Section */}
          <section className="relative py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
                Build and Monetize{' '}
                <span className="text-gradient">AI Services</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Create AI-powered applications without coding, deploy them instantly, 
                and start earning revenue through our integrated monetization platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="btn-primary btn-lg">
                  Get Started Free
                </button>
                <button className="btn-outline btn-lg">
                  View Templates
                </button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Everything you need to succeed
                </h2>
                <p className="text-lg text-gray-600">
                  From AI model integration to revenue optimization
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="card p-6 text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI Model Integration</h3>
                  <p className="text-gray-600">
                    Connect Teachable Machine, Hugging Face, or custom AI models with just a few clicks
                  </p>
                </div>
                
                <div className="card p-6 text-center">
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Instant Deployment</h3>
                  <p className="text-gray-600">
                    Deploy your AI services to Cloudflare Pages with automatic code generation
                  </p>
                </div>
                
                <div className="card p-6 text-center">
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Revenue Generation</h3>
                  <p className="text-gray-600">
                    Monetize your services with AdSense integration and revenue analytics
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
};

export default HomePage;