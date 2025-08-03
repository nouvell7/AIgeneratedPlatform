import React, { useState, useRef, useEffect } from 'react';

interface ServicePreviewProps {
  projectId: string;
  serviceUrl: string;
  previewUrl?: string;
  projectName: string;
}

const ServicePreview: React.FC<ServicePreviewProps> = ({
  projectId,
  serviceUrl,
  previewUrl,
  projectName,
}) => {
  const [currentView, setCurrentView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    generateQRCode();
    setShareUrl(serviceUrl);
  }, [serviceUrl]);

  const generateQRCode = async () => {
    try {
      // Use a QR code API service
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(serviceUrl)}`;
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out my AI service: ${projectName}`);
    const body = encodeURIComponent(`I've created an AI service called "${projectName}". You can try it out here: ${serviceUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Check out my AI service: ${projectName} ${serviceUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`);
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(serviceUrl);
    const title = encodeURIComponent(`My AI Service: ${projectName}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`);
  };

  const getViewportDimensions = () => {
    switch (currentView) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '600px' };
    }
  };

  const viewportDimensions = getViewportDimensions();

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Service Preview</h3>
            <div className="flex items-center space-x-3">
              {/* Viewport Selector */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentView('desktop')}
                  className={`p-2 rounded-md ${
                    currentView === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Desktop View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentView('tablet')}
                  className={`p-2 rounded-md ${
                    currentView === 'tablet'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Tablet View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentView('mobile')}
                  className={`p-2 rounded-md ${
                    currentView === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Mobile View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              {/* Actions */}
              <button
                onClick={handleRefresh}
                className="btn-outline btn-sm"
                title="Refresh Preview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <a
                href={serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7h10v10M7 7l10 10" />
                </svg>
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {/* Preview Frame */}
          <div className="relative bg-gray-100 flex items-center justify-center min-h-[400px]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="text-center">
                  <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
                  <p className="text-gray-600">Loading preview...</p>
                </div>
              </div>
            )}
            
            <div
              className="bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
              style={{
                width: viewportDimensions.width,
                height: viewportDimensions.height,
                maxWidth: '100%',
                maxHeight: '80vh',
              }}
            >
              <iframe
                ref={iframeRef}
                src={previewUrl || serviceUrl}
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                title={`${projectName} Preview`}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* URL and Sharing */}
        <div className="card">
          <div className="card-header">
            <h4 className="text-lg font-semibold text-gray-900">Share Your Service</h4>
          </div>
          <div className="card-body space-y-4">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="input flex-1 bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(shareUrl)}
                  className="btn-outline btn-sm"
                  title="Copy URL"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Social Sharing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share on Social Media
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={shareViaTwitter}
                  className="btn-outline btn-sm"
                  title="Share on Twitter"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Twitter
                </button>
                <button
                  onClick={shareViaLinkedIn}
                  className="btn-outline btn-sm"
                  title="Share on LinkedIn"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </button>
                <button
                  onClick={shareViaEmail}
                  className="btn-outline btn-sm"
                  title="Share via Email"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  QR Code
                </label>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  {showQR ? 'Hide' : 'Show'} QR Code
                </button>
              </div>
              {showQR && qrCodeUrl && (
                <div className="text-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="mx-auto border border-gray-200 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Scan to open on mobile device
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="card">
          <div className="card-header">
            <h4 className="text-lg font-semibold text-gray-900">Performance</h4>
          </div>
          <div className="card-body space-y-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-green-600">98%</div>
                <div className="text-xs text-gray-600">Uptime</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-blue-600">245ms</div>
                <div className="text-xs text-gray-600">Avg Response</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-purple-600">1.2K</div>
                <div className="text-xs text-gray-600">Total Requests</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-yellow-600">0.1%</div>
                <div className="text-xs text-gray-600">Error Rate</div>
              </div>
            </div>

            {/* SEO Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">SEO Score</span>
                <span className="text-sm font-semibold text-green-600">85/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Accessibility Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Accessibility</span>
                <span className="text-sm font-semibold text-blue-600">92/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            {/* Performance Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Performance</span>
                <span className="text-sm font-semibold text-yellow-600">78/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      <div className="card">
        <div className="card-header">
          <h4 className="text-lg font-semibold text-gray-900">Embed Your Service</h4>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-600 mb-4">
            Use this code to embed your AI service in other websites or applications.
          </p>
          <div className="space-y-4">
            {/* iframe Embed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                iframe Embed
              </label>
              <div className="flex items-center space-x-2">
                <textarea
                  value={`<iframe src="${serviceUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                  readOnly
                  rows={3}
                  className="input flex-1 bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(`<iframe src="${serviceUrl}" width="100%" height="600" frameborder="0"></iframe>`)}
                  className="btn-outline btn-sm"
                  title="Copy Embed Code"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* JavaScript Widget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JavaScript Widget
              </label>
              <div className="flex items-center space-x-2">
                <textarea
                  value={`<script src="${serviceUrl}/widget.js"></script>\n<div id="ai-service-widget" data-service="${projectId}"></div>`}
                  readOnly
                  rows={2}
                  className="input flex-1 bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(`<script src="${serviceUrl}/widget.js"></script>\n<div id="ai-service-widget" data-service="${projectId}"></div>`)}
                  className="btn-outline btn-sm"
                  title="Copy Widget Code"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePreview;