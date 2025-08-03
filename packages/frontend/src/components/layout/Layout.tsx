import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAppSelector } from '../../store';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = false }) => {
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {showSidebar && (
          <>
            {/* Desktop sidebar */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
              <Sidebar />
            </div>
            
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
                <div className="relative flex w-full max-w-xs flex-col bg-white pt-16">
                  <Sidebar />
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Main content */}
        <div className={`flex-1 ${showSidebar ? 'lg:pl-64' : ''}`}>
          <main className="pt-16">
            {children}
          </main>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout;