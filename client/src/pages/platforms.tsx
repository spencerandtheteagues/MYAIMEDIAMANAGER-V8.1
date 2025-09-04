import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, ExternalLink, Key, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiX, SiInstagram, SiFacebook, SiTiktok, SiLinkedin } from "react-icons/si";

interface Platform {
  id?: string;
  name: string;
  connected: boolean;
  username?: string;
  accountId?: string;
}

const platformIcons = {
  "X.com": SiX,
  "Instagram": SiInstagram,
  "Facebook": SiFacebook,
  "TikTok": SiTiktok,
  "LinkedIn": SiLinkedin,
};

export default function Platforms() {
  const { toast } = useToast();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [apiCredentials, setApiCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    accessTokenSecret: '',
    pageId: '',
    clientId: '',
    clientSecret: '',
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: platforms = [], isLoading } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const connectXMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/platforms/x/connect");
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Store codeVerifier in sessionStorage for the callback
      sessionStorage.setItem('x_code_verifier', data.codeVerifier);
      sessionStorage.setItem('x_state', data.state);
      
      // Open X OAuth in a new window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        data.authUrl,
        'XAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Check if window was closed
      const checkInterval = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkInterval);
          setConnectingPlatform(null);
          queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
        }
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to X. Please try again.",
        variant: "destructive",
      });
      setConnectingPlatform(null);
    },
  });

  const handleConnectX = () => {
    setConnectingPlatform("X.com");
    connectXMutation.mutate();
  };

  const connectWithApiKeysMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/platforms/connect-api", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Platform Connected",
        description: `Successfully connected to ${selectedPlatform}`,
      });
      setApiKeyDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect platform. Check your credentials.",
        variant: "destructive",
      });
    },
  });

  const handleDisconnect = async (platformName: string) => {
    try {
      await apiRequest("DELETE", `/api/platforms/${platformName}`);
      toast({
        title: "Platform Disconnected",
        description: `Successfully disconnected from ${platformName}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect platform",
        variant: "destructive",
      });
    }
  };

  const handleApiKeySubmit = async () => {
    setIsVerifying(true);
    const platform = platformData.find(p => p.name === selectedPlatform);
    
    if (!platform) return;
    
    const credentials: any = {
      platform: selectedPlatform,
    };
    
    platform.requiredFields.forEach((field: string) => {
      if (apiCredentials[field as keyof typeof apiCredentials]) {
        credentials[field] = apiCredentials[field as keyof typeof apiCredentials];
      }
    });
    
    try {
      await connectWithApiKeysMutation.mutateAsync(credentials);
    } finally {
      setIsVerifying(false);
    }
  };

  // Check for OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'x') {
      toast({
        title: "Successfully Connected",
        description: "Your X account has been connected!",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/platforms');
    } else if (params.get('error')) {
      toast({
        title: "Connection Failed",
        description: params.get('error') || "Failed to connect X account",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/platforms');
    }
  }, [toast]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const platformData = [
    { 
      name: "X.com", 
      description: "Connect to post tweets and threads",
      oauthAvailable: true,
      apiKeyAvailable: true,
      requiredFields: ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret'],
      instructions: 'Get your API keys from developer.x.com'
    },
    { 
      name: "Instagram", 
      description: "Share photos and stories",
      oauthAvailable: false,
      apiKeyAvailable: true,
      requiredFields: ['clientId', 'clientSecret', 'accessToken'],
      instructions: 'Set up Instagram Basic Display API at developers.facebook.com'
    },
    { 
      name: "Facebook", 
      description: "Connect with your community",
      oauthAvailable: false,
      apiKeyAvailable: true,
      requiredFields: ['pageId', 'accessToken'],
      instructions: 'Create a Facebook App and get Page Access Token'
    },
    { 
      name: "TikTok", 
      description: "Create and share short videos",
      oauthAvailable: false,
      apiKeyAvailable: true,
      requiredFields: ['clientId', 'clientSecret'],
      instructions: 'Register for TikTok API access at developers.tiktok.com'
    },
    { 
      name: "LinkedIn", 
      description: "Professional networking and content",
      oauthAvailable: false,
      apiKeyAvailable: true,
      requiredFields: ['clientId', 'clientSecret', 'accessToken'],
      instructions: 'Create LinkedIn App at developer.linkedin.com'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Connected Platforms</h1>
        <p className="text-muted-foreground mt-2">
          Manage your social media account connections
        </p>
      </div>

      <div className="grid gap-4">
        {platformData.map((platform) => {
          const Icon = platformIcons[platform.name as keyof typeof platformIcons];
          const isConnected = platforms.some(
            p => p.name === platform.name.replace(".com", " (Twitter)") && p.connected
          );
          const connectedPlatform = platforms.find(
            p => p.name === platform.name.replace(".com", " (Twitter)") && p.connected
          );

          return (
            <Card key={platform.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      {Icon && <Icon className="w-6 h-6" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <>
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                        {connectedPlatform?.username && (
                          <span className="text-sm text-muted-foreground">
                            {connectedPlatform.username}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {isConnected ? (
                      <span>Account connected and ready to post</span>
                    ) : platform.oauthAvailable ? (
                      <span>Click connect to link your account</span>
                    ) : (
                      <span>OAuth integration coming soon</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!isConnected && (
                      <>
                        {platform.oauthAvailable && (
                          <Button
                            onClick={() => platform.name === "X.com" && handleConnectX()}
                            disabled={connectingPlatform === platform.name}
                            variant="default"
                            data-testid={`button-oauth-${platform.name.toLowerCase()}`}
                          >
                            {connectingPlatform === platform.name ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                OAuth Connect
                              </>
                            )}
                          </Button>
                        )}
                        {platform.apiKeyAvailable && (
                          <Button
                            onClick={() => {
                              setSelectedPlatform(platform.name);
                              setApiKeyDialogOpen(true);
                              setApiCredentials({
                                apiKey: '',
                                apiSecret: '',
                                accessToken: '',
                                accessTokenSecret: '',
                                pageId: '',
                                clientId: '',
                                clientSecret: '',
                              });
                            }}
                            variant="outline"
                            data-testid={`button-apikey-${platform.name.toLowerCase()}`}
                          >
                            <Key className="w-4 h-4 mr-2" />
                            API Keys
                          </Button>
                        )}
                      </>
                    )}
                    {isConnected && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDisconnect(platform.name)}
                      >
                        Disconnect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>About Platform Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts to enable automated posting and analytics tracking.
            Your credentials are securely stored and used only for authorized actions.
          </p>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Secure OAuth Authentication</p>
                <p className="text-xs text-muted-foreground">
                  We use industry-standard OAuth 2.0 for secure account connections
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Granular Permissions</p>
                <p className="text-xs text-muted-foreground">
                  You control what permissions to grant for each platform
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Revoke Access Anytime</p>
                <p className="text-xs text-muted-foreground">
                  Disconnect platforms at any time to revoke access
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connect {selectedPlatform} with API Keys</DialogTitle>
            <DialogDescription>
              {platformData.find(p => p.name === selectedPlatform)?.instructions}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedPlatform === "X.com" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key (Consumer Key)</Label>
                  <Input
                    id="apiKey"
                    value={apiCredentials.apiKey}
                    onChange={(e) => setApiCredentials({...apiCredentials, apiKey: e.target.value})}
                    placeholder="Enter your X API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret (Consumer Secret)</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={apiCredentials.apiSecret}
                    onChange={(e) => setApiCredentials({...apiCredentials, apiSecret: e.target.value})}
                    placeholder="Enter your X API Secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    value={apiCredentials.accessToken}
                    onChange={(e) => setApiCredentials({...apiCredentials, accessToken: e.target.value})}
                    placeholder="Enter your Access Token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessTokenSecret">Access Token Secret</Label>
                  <Input
                    id="accessTokenSecret"
                    type="password"
                    value={apiCredentials.accessTokenSecret}
                    onChange={(e) => setApiCredentials({...apiCredentials, accessTokenSecret: e.target.value})}
                    placeholder="Enter your Access Token Secret"
                  />
                </div>
              </>
            )}
            
            {selectedPlatform === "Instagram" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={apiCredentials.clientId}
                    onChange={(e) => setApiCredentials({...apiCredentials, clientId: e.target.value})}
                    placeholder="Enter your Instagram Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={apiCredentials.clientSecret}
                    onChange={(e) => setApiCredentials({...apiCredentials, clientSecret: e.target.value})}
                    placeholder="Enter your Instagram Client Secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    value={apiCredentials.accessToken}
                    onChange={(e) => setApiCredentials({...apiCredentials, accessToken: e.target.value})}
                    placeholder="Enter your Access Token"
                  />
                </div>
              </>
            )}
            
            {selectedPlatform === "Facebook" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pageId">Page ID</Label>
                  <Input
                    id="pageId"
                    value={apiCredentials.pageId}
                    onChange={(e) => setApiCredentials({...apiCredentials, pageId: e.target.value})}
                    placeholder="Enter your Facebook Page ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Page Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={apiCredentials.accessToken}
                    onChange={(e) => setApiCredentials({...apiCredentials, accessToken: e.target.value})}
                    placeholder="Enter your Page Access Token"
                  />
                </div>
              </>
            )}
            
            {selectedPlatform === "TikTok" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={apiCredentials.clientId}
                    onChange={(e) => setApiCredentials({...apiCredentials, clientId: e.target.value})}
                    placeholder="Enter your TikTok Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={apiCredentials.clientSecret}
                    onChange={(e) => setApiCredentials({...apiCredentials, clientSecret: e.target.value})}
                    placeholder="Enter your TikTok Client Secret"
                  />
                </div>
              </>
            )}
            
            {selectedPlatform === "LinkedIn" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={apiCredentials.clientId}
                    onChange={(e) => setApiCredentials({...apiCredentials, clientId: e.target.value})}
                    placeholder="Enter your LinkedIn Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={apiCredentials.clientSecret}
                    onChange={(e) => setApiCredentials({...apiCredentials, clientSecret: e.target.value})}
                    placeholder="Enter your LinkedIn Client Secret"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    value={apiCredentials.accessToken}
                    onChange={(e) => setApiCredentials({...apiCredentials, accessToken: e.target.value})}
                    placeholder="Enter your Access Token"
                  />
                </div>
              </>
            )}
            
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your API credentials are encrypted and stored securely. They are only used to post content on your behalf.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setApiKeyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApiKeySubmit}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Connect Platform'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}