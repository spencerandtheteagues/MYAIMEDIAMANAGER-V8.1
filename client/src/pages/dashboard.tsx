import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Share2, 
  Heart, 
  Clock, 
  Calendar,
  TrendingUp,
  Users,
  MousePointer,
  Eye,
  Edit,
  CalendarPlus,
  Wand2,
  CheckCircle,
  Bot,
  BarChart3,
  Copy,
  Gift,
  Check
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import instagramLogo from "@/assets/logos/instagram.svg";
import facebookLogo from "@/assets/logos/facebook.svg";
import xLogo from "@/assets/logos/x.svg";
import tiktokLogo from "@/assets/logos/tiktok.svg";
import linkedinLogo from "@/assets/logos/linkedin.svg";

interface PlatformStatus {
  name: string;
  connected: boolean;
}

interface DashboardData {
  totalPosts: number;
  totalEngagement: number;
  pendingApproval: number;
  scheduledPosts: number;
  metrics: {
    totalReach: number;
    engagement: number;
    newFollowers: number;
    clickRate: number;
  };
  platformPerformance: Array<{
    platform: string;
    followers: number;
    engagement: number;
    change: number;
  }>;
  engagementOverTime: Array<{
    date: string;
    value: number;
  }>;
  topPerformingPosts: Array<{
    id: string;
    platform: string;
    content: string;
    publishedAt: string;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
    engagementRate: number;
  }>;
}

// Platform logos mapping
const platformLogos: Record<string, string> = {
  "Instagram": instagramLogo,
  "Facebook": facebookLogo,
  "X.com": xLogo,
  "TikTok": tiktokLogo,
  "LinkedIn": linkedinLogo,
};

export default function Dashboard() {
  const [copiedReferral, setCopiedReferral] = useState(false);
  const { toast } = useToast();
  
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard"],
  });

  const { data: platforms = [], isLoading: isLoadingPlatforms } = useQuery<PlatformStatus[]>({
    queryKey: ["/api/platforms"],
  });
  
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: referralStats } = useQuery({
    queryKey: ["/api/referral/stats"],
    enabled: !!currentUser,
  });

  const isLoading = isLoadingDashboard || isLoadingPlatforms;
  const hasConnectedPlatforms = platforms.some(p => p.connected);
  
  const referralLink = currentUser?.referralCode
    ? `${window.location.origin}/auth?ref=${currentUser.referralCode}`
    : '';
    
  const handleCopyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopiedReferral(true);
      toast({
        title: "Copied!",
        description: "Your referral link has been copied to clipboard.",
      });
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Program Section - PROMINENT DISPLAY */}
      {currentUser?.referralCode && (
        <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-2 border-primary/60 shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/50">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Refer Friends & Earn Credits
                    </h3>
                    <p className="text-sm text-muted-foreground">Share your link and get 100 credits for each friend who joins!</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-primary/30">
                      <p className="text-sm font-mono text-foreground break-all">{referralLink}</p>
                    </div>
                    <Button
                      onClick={handleCopyReferralLink}
                      variant="default"
                      size="sm"
                      className="min-w-[100px] bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
                    >
                      {copiedReferral ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {referralStats && (
                    <div className="flex items-center gap-6 text-sm pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-bold text-lg text-foreground">{referralStats.totalReferrals || 0}</span>
                          <span className="text-xs text-muted-foreground block">Referrals</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <span className="font-bold text-lg text-foreground">{referralStats.totalCreditsEarned || 0}</span>
                          <span className="text-xs text-muted-foreground block">Credits Earned</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Connected Platforms Status - REAL STATUS */}
      <section>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Platform Connections</h3>
        {!hasConnectedPlatforms ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Share2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium mb-2">No Platforms Connected</p>
                <p className="text-sm">Connect to a platform to start displaying live analytics and publishing content</p>
              </div>
              <Link href="/settings">
                <Button className="mt-4">
                  Connect Your First Platform
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {platforms.map((platform) => (
              <Card key={platform.name} className={`text-center overflow-hidden transition-all ${platform.connected ? 'hover:shadow-lg' : 'opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg overflow-hidden shadow-md">
                    <img 
                      src={platformLogos[platform.name]} 
                      alt={`${platform.name} logo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-foreground">{platform.name}</p>
                  {platform.connected ? (
                    <p className="text-xs text-green-600 mt-1 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                      Connected
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Not Connected</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Key Metrics - REAL DATA */}
      <section>
        {!hasConnectedPlatforms ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground mb-2">Analytics Unavailable</p>
              <p className="text-sm text-muted-foreground">Connect to a platform to start displaying live analytics</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Posts This Month</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {dashboardData?.totalPosts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Share2 className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-muted-foreground text-sm">Real-time data</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Engagement</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {dashboardData?.totalEngagement.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Heart className="text-green-600 dark:text-green-400 w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-muted-foreground text-sm">From all platforms</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {dashboardData?.pendingApproval || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                  <Clock className="text-amber-600 dark:text-amber-400 w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Link href="/approval">
                  <Button variant="link" className="p-0 h-auto text-primary">
                    Review Now →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled Posts</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {dashboardData?.scheduledPosts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Calendar className="text-purple-600 dark:text-purple-400 w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className="text-muted-foreground text-sm">{dashboardData?.scheduledPosts && dashboardData.scheduledPosts > 0 ? 'Ready to publish' : 'No posts scheduled'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </section>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/create">
              <Button variant="ghost" className="w-full justify-between h-auto p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Edit className="text-primary w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm sm:text-base font-medium text-foreground">Create New Post</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Use AI to generate content</div>
                  </div>
                </div>
                <div className="w-5 h-5 text-muted-foreground" />
              </Button>
            </Link>

            <Link href="/calendar">
              <Button variant="ghost" className="w-full justify-between h-auto p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <CalendarPlus className="text-green-600 dark:text-green-400 w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">Schedule Content</div>
                    <div className="text-sm text-muted-foreground">Plan your posting calendar</div>
                  </div>
                </div>
                <div className="w-5 h-5 text-muted-foreground" />
              </Button>
            </Link>

            <Button variant="ghost" className="w-full justify-between h-auto p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Wand2 className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-foreground">AI Content Ideas</div>
                  <div className="text-sm text-muted-foreground">Get smart suggestions</div>
                </div>
              </div>
              <div className="w-5 h-5 text-muted-foreground" />
            </Button>

            <Link href="/referrals">
              <Button variant="ghost" className="w-full justify-between h-auto p-3 sm:p-4 bg-gradient-to-r from-amber-900/20 to-orange-900/20 hover:from-amber-900/30 hover:to-orange-900/30 border border-amber-800">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Gift className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm sm:text-base font-medium text-foreground">Refer and Earn Free Credits</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Get 100 credits per referral</div>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">New!</Badge>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600 dark:text-green-400 w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Post approved and published</div>
                <div className="text-xs text-muted-foreground mt-1">"Morning coffee specials..." • 2 hours ago</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Bot className="text-blue-600 dark:text-blue-400 w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">AI generated 3 new content ideas</div>
                <div className="text-xs text-muted-foreground mt-1">For your café business • 4 hours ago</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                <Clock className="text-amber-600 dark:text-amber-400 w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Content pending approval</div>
                <div className="text-xs text-muted-foreground mt-1">"Weekend brunch menu..." • 6 hours ago</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Calendar className="text-purple-600 dark:text-purple-400 w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">5 posts scheduled for this week</div>
                <div className="text-xs text-muted-foreground mt-1">Cross-platform campaign • Yesterday</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
