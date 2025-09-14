import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Copy, Users, TrendingUp, Trophy, Star, Crown, Zap, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: {
    totalReferrals: number;
    completedReferrals: number;
    creditsEarned: number;
    pendingReferrals: number;
  };
  recentReferrals: Array<{
    id: string;
    referredUserId: string;
    referralCode: string;
    creditsEarned: number;
    status: string;
    completedAt: string | null;
    createdAt: string;
  }>;
}

export default function Referrals() {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const { data: referralData, isLoading, error } = useQuery<ReferralData>({
    queryKey: ["/api/referral/me"],
  });
  
  const handleCopyCode = () => {
    if (!referralData?.referralCode) return;
    navigator.clipboard.writeText(referralData.referralCode);
    setCopiedCode(true);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };
  
  const handleCopyLink = () => {
    if (!referralData?.referralLink) return;
    navigator.clipboard.writeText(referralData.referralLink);
    setCopiedLink(true);
    toast({
      title: "Link Copied!",
      description: "Share this link with your friends",
    });
  };

  const freeTrialRewards = [25, 30, 35, 40, 45, 50];
  const progressToFreeSubscription = Math.min(((referralData?.stats?.completedReferrals || 0) / 25) * 100, 100);
  
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load referral data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Gift className="w-8 h-8 text-primary" />
          Referral Program
        </h1>
        <p className="text-muted-foreground mt-2">
          Earn rewards by inviting friends to MyAiMediaMgr
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>Share this code or link with friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={referralData?.referralCode || ''} 
                readOnly 
                className="font-mono text-lg font-bold"
              />
              <Button 
                onClick={handleCopyCode}
                variant={copiedCode ? "default" : "outline"}
                data-testid="button-copy-code"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Copied" : "Copy"}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCopyLink} 
                className="flex-1"
                data-testid="button-share-link"
              >
                <Gift className="w-4 h-4 mr-2" />
                Copy Referral Link
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                data-testid="button-share-social"
              >
                Share on Social Media
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Referrals</span>
              <span className="font-bold">{referralData?.stats?.totalReferrals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Free Trials</span>
              <span className="font-bold">{referralData?.stats?.completedReferrals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid Subscriptions</span>
              <span className="font-bold">{referralData?.stats?.pendingReferrals || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Credits Earned</span>
              <span className="font-bold text-primary">{referralData?.stats?.creditsEarned || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards" className="text-xs sm:text-sm">Rewards</TabsTrigger>
          <TabsTrigger value="progress" className="text-xs sm:text-sm">Progress</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Free Trial Referrals
              </CardTitle>
              <CardDescription>
                Earn increasing credits for your first 5 free trial referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {freeTrialRewards.map((credits, index) => {
                  const isCompleted = index < (referralData?.stats?.completedReferrals || 0);
                  return (
                    <div 
                      key={index}
                      className={`text-center p-4 rounded-lg border ${
                        isCompleted 
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                          : 'bg-muted/50 border-muted-foreground/20'
                      }`}
                    >
                      <div className="text-xs text-muted-foreground mb-1">
                        Referral #{index + 1}
                      </div>
                      <div className={`text-2xl font-bold ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                        {credits}
                      </div>
                      <div className="text-xs text-muted-foreground">credits</div>
                      {isCompleted && <Check className="w-4 h-4 mx-auto mt-2 text-green-600" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-500" />
                Paid Subscription Referrals
              </CardTitle>
              <CardDescription>
                Earn premium rewards for paid subscription referrals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Per Referral</span>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      100 Credits
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Earn 100 credits for each friend who upgrades to a paid plan
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Milestone Reward</span>
                    <Badge className="bg-gradient-to-r from-gold-500 to-yellow-500 text-white">
                      Free Month
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get a free month subscription after 25 paid referrals
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Progress to Free Subscription</span>
                  <span className="text-sm font-bold">{referralData?.stats?.completedReferrals || 0}/25</span>
                </div>
                <Progress value={progressToFreeSubscription} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  {25 - (referralData?.stats?.completedReferrals || 0)} more referrals needed for a free month!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold-500" />
                Your Achievement Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Level Progress</span>
                  <span className="font-bold">{referralData.currentTierProgress}/{referralData.nextMilestone}</span>
                </div>
                <Progress value={(referralData.currentTierProgress / referralData.nextMilestone) * 100} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 border rounded-lg ${(referralData?.stats?.totalReferrals || 0) >= 1 ? 'bg-bronze-50 border-bronze-200' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-bronze-500" />
                    <span className="font-medium">Bronze Referrer</span>
                  </div>
                  <p className="text-sm text-muted-foreground">1+ referrals</p>
                  {(referralData?.stats?.totalReferrals || 0) >= 1 && <Badge className="mt-2">Achieved</Badge>}
                </div>
                
                <div className={`p-4 border rounded-lg ${(referralData?.stats?.totalReferrals || 0) >= 5 ? 'bg-silver-50 border-silver-200' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-silver-500" />
                    <span className="font-medium">Silver Referrer</span>
                  </div>
                  <p className="text-sm text-muted-foreground">5+ referrals</p>
                  {(referralData?.stats?.totalReferrals || 0) >= 5 && <Badge className="mt-2">Achieved</Badge>}
                </div>
                
                <div className={`p-4 border rounded-lg ${(referralData?.stats?.totalReferrals || 0) >= 10 ? 'bg-gold-50 border-gold-200' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-gold-500" />
                    <span className="font-medium">Gold Referrer</span>
                  </div>
                  <p className="text-sm text-muted-foreground">10+ referrals</p>
                  {(referralData?.stats?.totalReferrals || 0) >= 10 && <Badge className="mt-2">Achieved</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
              <CardDescription>Track your referrals and earned credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(referralData?.recentReferrals || []).map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        referral.status === 'completed' 
                          ? 'bg-purple-100 dark:bg-purple-900' 
                          : 'bg-green-100 dark:bg-green-900'
                      }`}>
                        {referral.status === 'completed' ? (
                          <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {referral.status === 'completed' ? 'Completed Referral' : 'Pending Referral'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">+{referral.creditsEarned} credits</p>
                      <Badge variant={referral.status === 'completed' ? 'default' : 'outline'}>
                        {referral.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}