import { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAppSelector } from '../store';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const SettingsPage: NextPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'billing', name: 'Billing', icon: '💳' },
  ];

  return (
    <>
      <Head>
        <title>Settings - AI Service Platform</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Head>

      <ProtectedRoute>
        <Layout showSidebar>
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your account settings and preferences.
              </p>
            </div>

            <div className="flex space-x-8">
              {/* Sidebar */}
              <div className="w-64 flex-shrink-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1">
                {activeTab === 'profile' && (
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          defaultValue={user?.email?.split('@')[0] || ''}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          type="text"
                          value={user?.role || ''}
                          disabled
                          className="mt-1"
                        />
                      </div>
                      <Button>Save Changes</Button>
                    </div>
                  </Card>
                )}

                {activeTab === 'notifications' && (
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Email Notifications</h3>
                          <p className="text-sm text-gray-600">Receive updates via email</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Push Notifications</h3>
                          <p className="text-sm text-gray-600">Receive push notifications</p>
                        </div>
                        <input type="checkbox" className="rounded" />
                      </div>
                      <Button>Save Preferences</Button>
                    </div>
                  </Card>
                )}

                {activeTab === 'security' && (
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          className="mt-1"
                        />
                      </div>
                      <Button>Update Password</Button>
                    </div>
                  </Card>
                )}

                {activeTab === 'billing' && (
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Billing Information</h2>
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-medium text-green-800">Free Plan</h3>
                        <p className="text-sm text-green-600">
                          You are currently on the free plan with unlimited projects.
                        </p>
                      </div>
                      <Button variant="outline">Upgrade Plan</Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default SettingsPage;