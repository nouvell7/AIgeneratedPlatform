import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Settings,
  DollarSign
} from 'lucide-react';

interface AdSenseSetupProps {
  projectId: string;
  onSetupComplete?: () => void;
}

interface AdSenseAccount {
  id: string;
  publisherId: string;
  status: 'pending' | 'approved' | 'rejected';
  earnings: number;
  isConnected: boolean;
}

export const AdSenseSetup: React.FC<AdSenseSetupProps> = ({
  projectId,
  onSetupComplete
}) => {
  const [activeTab, setActiveTab] = useState('connect');
  const [publisherId, setPublisherId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<AdSenseAccount | null>(null);
  const [adSettings, setAdSettings] = useState({
    enableAutoAds: true,
    enableDisplayAds: true,
    enableTextAds: true,
    enableVideoAds: false,
    adDensity: 'medium' as 'low' | 'medium' | 'high',
    blockAdultContent: true,
    blockGambling: true,
    blockAlcohol: false,
  });

  const handleConnectAdSense = async () => {
    if (!publisherId.trim()) {
      return;
    }

    setIsConnecting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAccount: AdSenseAccount = {
        id: 'adsense-' + Date.now(),
        publisherId,
        status: 'approved',
        earnings: Math.random() * 1000 + 100,
        isConnected: true,
      };
      
      setAccount(mockAccount);
      setActiveTab('settings');
      onSetupComplete?.();
    } catch (error) {
      console.error('Failed to connect AdSense:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('AdSense settings saved:', adSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AdSense Setup</h2>
          <p className="text-gray-600">Connect your Google AdSense account to start earning revenue</p>
        </div>
        {account && (
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-lg font-semibold">${account.earnings.toFixed(2)}</span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connect">Connect Account</TabsTrigger>
          <TabsTrigger value="settings" disabled={!account}>Ad Settings</TabsTrigger>
          <TabsTrigger value="optimization" disabled={!account}>Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="connect" className="space-y-6">
          {!account ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="h-5 w-5" />
                  <span>Connect Google AdSense</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You need a Google AdSense account to monetize your website. 
                    If you don't have one, <a href="https://www.google.com/adsense/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">create one here</a>.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="publisherId">AdSense Publisher ID</Label>
                  <Input
                    id="publisherId"
                    placeholder="pub-1234567890123456"
                    value={publisherId}
                    onChange={(e) => setPublisherId(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Find your Publisher ID in your AdSense account under Account → Account information
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Before connecting, make sure:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Your AdSense account is approved</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Your website has quality content</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>You comply with AdSense policies</span>
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={handleConnectAdSense}
                  disabled={!publisherId.trim() || isConnecting}
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Connect AdSense Account'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AdSense Account Connected</span>
                  {getStatusBadge(account.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Publisher ID</Label>
                    <p className="font-mono text-sm">{account.publisherId}</p>
                  </div>
                  <div>
                    <Label>Current Earnings</Label>
                    <p className="text-lg font-semibold text-green-600">
                      ${account.earnings.toFixed(2)}
                    </p>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your AdSense account is successfully connected and ready to display ads.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Ad Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Ad Types</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={adSettings.enableAutoAds}
                      onChange={(e) => setAdSettings(prev => ({
                        ...prev,
                        enableAutoAds: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Enable Auto Ads (Recommended)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={adSettings.enableDisplayAds}
                      onChange={(e) => setAdSettings(prev => ({
                        ...prev,
                        enableDisplayAds: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Display Ads</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={adSettings.enableTextAds}
                      onChange={(e) => setAdSettings(prev => ({
                        ...prev,
                        enableTextAds: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Text Ads</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={adSettings.enableVideoAds}
                      onChange={(e) => setAdSettings(prev => ({
                        ...prev,
                        enableVideoAds: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Video Ads</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Ad Density</h4>
                <div className="flex space-x-4">
                  {(['low', 'medium', 'high'] as const).map((density) => (
                    <label key={density} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="adDensity"
                        value={density}
                        checked={adSettings.adDensity === density}
                        onChange={(e) => setAdSettings(prev => ({
                          ...prev,
                          adDensity: e.target.value as 'low' | 'medium' | 'high'
                        }))}
                      />
                      <span className="capitalize">{density}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Higher density may increase revenue but could impact user experience
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Content Filtering</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={adSettings.blockAdultContent}
                      onChange={(e) => setAdSettings(prev => ({
                        ...prev,
                        blockAdultContent: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Block adult content</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={adSettings.blockGambling}
                      onChange={(e) => setAdSettings(prev => ({
                        ...prev,
                        blockGambling: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Block gambling ads</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={adSettings.blockAlcohol}
                      onChange={(e) => setAdSettings(prev => ({
                        ...prev,
                        blockAlcohol: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Block alcohol ads</span>
                  </label>
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                Save Ad Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Optimization recommendations will appear here once you have sufficient data.
                  This typically takes 7-14 days after connecting your AdSense account.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Coming Soon:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Ad placement optimization</li>
                  <li>• Performance analytics</li>
                  <li>• Revenue forecasting</li>
                  <li>• A/B testing recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};