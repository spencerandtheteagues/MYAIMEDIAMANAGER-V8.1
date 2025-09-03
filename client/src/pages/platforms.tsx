import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
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
      oauthAvailable: true 
    },
    { 
      name: "Instagram", 
      description: "Share photos and stories",
      oauthAvailable: false 
    },
    { 
      name: "Facebook", 
      description: "Connect with your community",
      oauthAvailable: false 
    },
    { 
      name: "TikTok", 
      description: "Create and share short videos",
      oauthAvailable: false 
    },
    { 
      name: "LinkedIn", 
      description: "Professional networking and content",
      oauthAvailable: false 
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
                    {!isConnected && platform.oauthAvailable && (
                      <Button
                        onClick={() => platform.name === "X.com" && handleConnectX()}
                        disabled={connectingPlatform === platform.name}
                        data-testid={`button-connect-${platform.name.toLowerCase()}`}
                      >
                        {connectingPlatform === platform.name ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect Account
                          </>
                        )}
                      </Button>
                    )}
                    {isConnected && (
                      <Button variant="destructive" size="sm">
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
    </div>
  );
}