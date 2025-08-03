import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Calendar,
  Download,
  RefreshCw,
  Target,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface RevenueDashboardProps {
  projectId: string;
}

interface RevenueData {
  totalEarnings: number;
  todayEarnings: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  fillRate: number;
  earningsChart: Array<{
    date: string;
    earnings: number;
    impressions: number;
    clicks: number;
  }>;
  topPerformingAds: Array<{
    id: string;
    type: string;
    earnings: number;
    ctr: number;
    impressions: number;
  }>;
  revenueBreakdown: Array<{
    source: string;
    earnings: number;
    percentage: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const RevenueDashboard: React.FC<RevenueDashboardProps> = ({ projectId }) => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRevenueData();
  }, [projectId, timeRange]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: RevenueData = {
        totalEarnings: Math.random() * 1000 + 500,
        todayEarnings: Math.random() * 50 + 10,
        impressions: Math.floor(Math.random() * 50000) + 10000,
        clicks: Math.floor(Math.random() * 1000) + 200,
        ctr: Math.random() * 3 + 1,
        cpm: Math.random() * 2 + 0.5,
        fillRate: Math.random() * 0.2 + 0.8,
        earningsChart: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          earnings: Math.random() * 50 + 10,
          impressions: Math.floor(Math.random() * 2000) + 500,
          clicks: Math.floor(Math.random() * 50) + 10,
        })),
        topPerformingAds: [
          {
            id: 'ad1',
            type: 'Display Banner',
            earnings: Math.random() * 200 + 100,
            ctr: Math.random() * 2 + 1,
            impressions: Math.floor(Math.random() * 10000) + 5000,
          },
          {
            id: 'ad2',
            type: 'Text Ad',
            earnings: Math.random() * 150 + 75,
            ctr: Math.random() * 1.5 + 0.5,
            impressions: Math.floor(Math.random() * 8000) + 3000,
          },
          {
            id: 'ad3',
            type: 'Native Ad',
            earnings: Math.random() * 100 + 50,
            ctr: Math.random() * 3 + 2,
            impressions: Math.floor(Math.random() * 5000) + 2000,
          },
        ],
        revenueBreakdown: [
          { source: 'Display Ads', earnings: Math.random() * 400 + 200, percentage: 45 },
          { source: 'Text Ads', earnings: Math.random() * 300 + 150, percentage: 30 },
          { source: 'Native Ads', earnings: Math.random() * 200 + 100, percentage: 20 },
          { source: 'Video Ads', earnings: Math.random() * 100 + 50, percentage: 5 },
        ],
      };
      
      setRevenueData(mockData);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRevenueData();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // Simulate export functionality
    const dataStr = JSON.stringify(revenueData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-data-${projectId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load revenue data</p>
        <Button onClick={fetchRevenueData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Revenue Dashboard</h2>
          <p className="text-gray-600">Track your advertising revenue and performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {(['7d', '30d', '90d'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">${revenueData.totalEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+12.5%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold">${revenueData.todayEarnings.toFixed(2)}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-500">Updated 5 min ago</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Impressions</p>
                <p className="text-2xl font-bold">{revenueData.impressions.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-500">CTR: {revenueData.ctr.toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clicks</p>
                <p className="text-2xl font-bold">{revenueData.clicks.toLocaleString()}</p>
              </div>
              <MousePointer className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-500">CPM: ${revenueData.cpm.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData.earningsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Click-through Rate</span>
                  <Badge variant="secondary">{revenueData.ctr.toFixed(2)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cost per Mille</span>
                  <Badge variant="secondary">${revenueData.cpm.toFixed(2)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Fill Rate</span>
                  <Badge variant="secondary">{(revenueData.fillRate * 100).toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Revenue per Click</span>
                  <Badge variant="secondary">
                    ${(revenueData.totalEarnings / revenueData.clicks).toFixed(3)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Ads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData.topPerformingAds.map((ad, index) => (
                    <div key={ad.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{ad.type}</p>
                        <p className="text-sm text-gray-500">
                          {ad.impressions.toLocaleString()} impressions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${ad.earnings.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{ad.ctr.toFixed(2)}% CTR</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impressions vs Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData.earningsChart.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impressions" fill="#8884d8" name="Impressions" />
                  <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Ad Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueData.revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="earnings"
                    >
                      {revenueData.revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData.revenueBreakdown.map((item, index) => (
                    <div key={item.source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.source}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.earnings.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};