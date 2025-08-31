import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Instagram, Facebook, Twitter, Linkedin, 
  CheckCircle, AlertCircle, ExternalLink, Settings, Link2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  isConnected: boolean;
  requiresOAuth: boolean;
  status: 'active' | 'limited' | 'unavailable';
  description: string;
  connectionMethod: string;
  limitations?: string[];
}

export default function ConnectPlatforms() {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const response = await fetch("/api/platforms", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Define platform configurations with current 2025 status
        const platformConfigs: Platform[] = [
          {
            id: "instagram",
            name: "Instagram",
            icon: <Instagram className="h-6 w-6" />,
            color: "#E1306C",
            isConnected: data.some((p: any) => p.name === "Instagram" && p.isConnected),
            requiresOAuth: true,
            status: "limited",
            description: "Connect your Instagram Business account for posting and analytics",
            connectionMethod: "OAuth 2.0 through Meta Developer Portal",
            limitations: [
              "Requires Instagram Business or Creator Account",
              "Meta Developer account setup needed",
              "Subject to review and approval",
              "Posting limited by Instagram API restrictions"
            ]
          },
          {
            id: "facebook",
            name: "Facebook",
            icon: <Facebook className="h-6 w-6" />,
            color: "#1877F2",
            isConnected: data.some((p: any) => p.name === "Facebook" && p.isConnected),
            requiresOAuth: true,
            status: "limited",
            description: "Connect your Facebook Page for business posting",
            connectionMethod: "OAuth 2.0 through Meta Business Suite",
            limitations: [
              "Requires Facebook Business Page",
              "Limited to approved apps only",
              "Groups API no longer available",
              "Strict content moderation policies"
            ]
          },
          {
            id: "twitter",
            name: "X (Twitter)",
            icon: <Twitter className="h-6 w-6" />,
            color: "#1DA1F2", 
            isConnected: data.some((p: any) => p.name === "X (Twitter)" && p.isConnected),
            requiresOAuth: true,
            status: "limited",
            description: "Connect your X account for tweets and engagement",
            connectionMethod: "OAuth 2.0 with elevated access required",
            limitations: [
              "API access significantly restricted since 2023",
              "Requires paid Twitter API subscription",
              "Rate limits apply to all operations",
              "Content moderation may affect posting"
            ]
          },
          {
            id: "linkedin",
            name: "LinkedIn",
            icon: <Linkedin className="h-6 w-6" />,
            color: "#0A66C2",
            isConnected: data.some((p: any) => p.name === "LinkedIn" && p.isConnected),
            requiresOAuth: true,
            status: "active",
            description: "Connect your LinkedIn profile or company page",
            connectionMethod: "OAuth 2.0 through LinkedIn Developer Portal",
            limitations: [
              "Personal posts limited to own profile",
              "Company page access requires admin rights",
              "Professional content guidelines apply"
            ]
          },
          {
            id: "tiktok",
            name: "TikTok",
            icon: <div className="h-6 w-6 bg-black rounded text-white flex items-center justify-center text-xs font-bold">T</div>,
            color: "#000000",
            isConnected: data.some((p: any) => p.name === "TikTok" && p.isConnected),
            requiresOAuth: true,
            status: "unavailable",
            description: "TikTok API access is very limited",
            connectionMethod: "Business API access by invitation only",
            limitations: [
              "No public API available",
              "Business API requires special approval",
              "Limited to large enterprise partners",
              "Analytics access extremely restricted"
            ]
          }
        ];
        
        setPlatforms(platformConfigs);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load platform connections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (platform: Platform) => {
    if (platform.status === 'unavailable') {
      toast({
        title: "Platform Unavailable",
        description: `${platform.name} integration is not currently available due to API restrictions.`,
        variant: "destructive",
      });
      return;
    }

    setConnectingPlatform(platform.id);
    
    // Simulate OAuth flow - in production, this would redirect to platform's OAuth endpoint
    toast({
      title: "OAuth Setup Required",
      description: `To connect ${platform.name}, you'll need to set up OAuth credentials in your developer account.`,
    });

    // For demo purposes, mark as connected after delay
    setTimeout(() => {
      setPlatforms(prev => prev.map(p => 
        p.id === platform.id ? { ...p, isConnected: true } : p
      ));
      setConnectingPlatform(null);
      toast({
        title: "Connection Simulated",
        description: `${platform.name} connection setup initiated. In production, this would complete the OAuth flow.`,
      });
    }, 2000);
  };

  const handleDisconnect = async (platform: Platform) => {
    try {
      setPlatforms(prev => prev.map(p => 
        p.id === platform.id ? { ...p, isConnected: false } : p
      ));
      
      toast({
        title: "Disconnected",
        description: `${platform.name} has been disconnected from your account.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect platform",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Platform['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="ml-2">Available</Badge>;
      case 'limited':
        return <Badge variant="secondary" className="ml-2">Limited</Badge>;
      case 'unavailable':
        return <Badge variant="destructive" className="ml-2">Unavailable</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connect Your Platforms</h1>
        <p className="text-muted-foreground mt-2">
          Connect your social media accounts to enable posting and analytics across all platforms.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Social media platforms now require OAuth authentication for security. 
          Simple username/password connections are no longer supported by any major platform as of 2025.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <Card key={platform.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div style={{ color: platform.color }}>
                    {platform.icon}
                  </div>
                  <CardTitle className="text-lg">{platform.name}</CardTitle>
                </div>
                <div className="flex items-center">
                  {platform.isConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                  )}
                  {getStatusBadge(platform.status)}
                </div>
              </div>
              <CardDescription>
                {platform.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>Connection Method:</strong> {platform.connectionMethod}
              </div>
              
              {platform.limitations && platform.limitations.length > 0 && (
                <div className="text-sm">
                  <strong className="text-yellow-600">Limitations:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                    {platform.limitations.map((limitation, index) => (
                      <li key={index}>{limitation}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-2">
                {platform.isConnected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(platform)}
                      className="flex-1"
                      data-testid={`button-disconnect-${platform.id}`}
                    >
                      Disconnect
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{platform.name} Connection Settings</DialogTitle>
                          <DialogDescription>
                            Manage your {platform.name} connection and posting preferences.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span>Status</span>
                            <Badge variant="default">Connected</Badge>
                          </div>
                          <div className="space-y-2">
                            <Label>Default Posting Options</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm">Auto-hashtags</Button>
                              <Button variant="outline" size="sm">Optimal timing</Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <Button
                    onClick={() => handleConnect(platform)}
                    disabled={connectingPlatform === platform.id || platform.status === 'unavailable'}
                    className="flex-1"
                    style={{ backgroundColor: platform.status !== 'unavailable' ? platform.color : undefined }}
                    data-testid={`button-connect-${platform.id}`}
                  >
                    {connectingPlatform === platform.id ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {platform.status === 'unavailable' ? 'Unavailable' : 'Connect'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why No Username/Password Login?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            As of 2025, all major social media platforms have discontinued username/password authentication 
            for third-party applications due to security and policy changes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>Security:</strong> OAuth 2.0 provides better security with token-based authentication</li>
            <li><strong>Platform Policies:</strong> Platforms no longer allow password-based third-party access</li>
            <li><strong>User Safety:</strong> Prevents apps from storing or accessing your actual passwords</li>
            <li><strong>Compliance:</strong> Required for platform certification and continued API access</li>
          </ul>
          <p className="text-muted-foreground">
            Our system uses industry-standard OAuth flows to keep your accounts secure while enabling 
            seamless content management across all connected platforms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}