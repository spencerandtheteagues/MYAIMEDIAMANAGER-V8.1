import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  User, 
  CreditCard,
  Shield, 
  AlertTriangle,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Package,
  Calendar,
  Lock,
  Mail,
  Trash2,
  XCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface CreditPack {
  credits: number;
  price: number;
  popular?: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Modals state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedCreditPack, setSelectedCreditPack] = useState<CreditPack | null>(null);
  
  // Form states
  const [profileData, setProfileData] = useState({
    fullName: "",
    businessName: "",
    email: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [emailData, setEmailData] = useState({
    newEmail: "",
    confirmEmail: "",
  });

  // Queries
  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });
  
  const { data: billingHistory } = useQuery({
    queryKey: ["/api/user/billing-history"],
  });

  // Update profile data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || "",
        businessName: user.businessName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Subscription plans
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "starter",
      name: "Starter",
      price: 19,
      credits: 190,
      features: [
        "190 AI credits per month",
        "All social platforms",
        "Content calendar",
        "Basic analytics",
        "Email support"
      ]
    },
    {
      id: "professional",
      name: "Professional",
      price: 49,
      credits: 500,
      features: [
        "500 AI credits per month",
        "All social platforms",
        "Advanced scheduling",
        "Team collaboration",
        "Priority support",
        "Custom branding"
      ],
      popular: true
    },
    {
      id: "business",
      name: "Business",
      price: 199,
      credits: 2000,
      features: [
        "2000 AI credits per month",
        "All social platforms",
        "Multi-account management",
        "API access",
        "Dedicated support",
        "Custom integrations",
        "Advanced analytics"
      ]
    }
  ];

  // Credit packs
  const creditPacks: CreditPack[] = [
    { credits: 50, price: 5 },
    { credits: 200, price: 18, popular: true },
    { credits: 500, price: 40 }
  ];

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", "/api/user", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", "/api/user/password", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  });

  const changeEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", "/api/user/email", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email change request sent. Please check your new email for verification.",
      });
      setEmailData({
        newEmail: "",
        confirmEmail: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change email",
        variant: "destructive",
      });
    }
  });

  // Redirect to custom checkout for subscription upgrades
  const handleCheckoutRedirect = (planId: string) => {
    setLocation(`/checkout?plan=${planId}`);
  };

  const buyCreditsHandler = useMutation({
    mutationFn: async (pack: CreditPack) => {
      return apiRequest("POST", "/api/credits/purchase", { 
        credits: pack.credits,
        price: pack.price 
      });
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Success",
          description: "Credits added to your account",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to purchase credits",
        variant: "destructive",
      });
    }
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/subscription/cancel");
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You'll retain access until the end of your billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/user/account");
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted. You will be logged out shortly.",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    }
  });

  // Handlers
  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleEmailChange = () => {
    if (emailData.newEmail !== emailData.confirmEmail) {
      toast({
        title: "Error",
        description: "Email addresses do not match",
        variant: "destructive",
      });
      return;
    }
    changeEmailMutation.mutate({ newEmail: emailData.newEmail });
  };

  const handleUpgradePlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    handleCheckoutRedirect(plan.id);
  };

  const handleBuyCredits = (pack: CreditPack) => {
    setSelectedCreditPack(pack);
    buyCreditsHandler.mutate(pack);
  };

  // Calculate credits usage percentage
  const getCreditsUsagePercentage = () => {
    if (!user) return 0;
    const maxCredits = getMaxCreditsForTier(user.tier || "free");
    return Math.min((user.credits / maxCredits) * 100, 100);
  };

  const getMaxCreditsForTier = (tier: string) => {
    switch (tier) {
      case "starter": return 190;
      case "professional": return 500;
      case "business": return 2000;
      default: return 50; // free trial
    }
  };

  const getTierDisplayName = (tier?: string) => {
    switch (tier) {
      case "starter": return "Starter";
      case "professional": return "Professional";
      case "business": return "Business";
      case "pay_as_you_go": return "Pay As You Go";
      default: return "Free Trial";
    }
  };

  const getTierBadgeVariant = (tier?: string): "default" | "secondary" | "outline" => {
    switch (tier) {
      case "professional": 
      case "business": 
        return "default";
      case "starter": 
        return "secondary";
      default: 
        return "outline";
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </CardTitle>
            <CardDescription>
              Manage your account, subscription, and security settings
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="danger">Danger Zone</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {/* Account Settings */}
                <TabsContent value="account" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>Profile Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={profileData.fullName}
                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                            placeholder="Enter your full name"
                            data-testid="input-fullname"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            value={profileData.businessName}
                            onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                            placeholder="Enter your business name"
                            data-testid="input-businessname"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={profileData.email}
                          disabled
                          className="bg-muted"
                          data-testid="input-email-display"
                        />
                        <p className="text-sm text-muted-foreground">
                          To change your email, go to the Security tab
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handleProfileUpdate} 
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-update-profile"
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Profile"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* Subscription Settings */}
                <TabsContent value="subscription" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-5 h-5" />
                          <span>Current Subscription</span>
                        </div>
                        <Badge variant={getTierBadgeVariant(user?.tier)}>
                          {getTierDisplayName(user?.tier)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Credits Usage */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Credits Available</span>
                          <span className="font-medium">{user?.credits || 0} / {getMaxCreditsForTier(user?.tier || "free")}</span>
                        </div>
                        <Progress value={getCreditsUsagePercentage()} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Credits reset on the first of each month
                        </p>
                      </div>

                      {/* Billing Info */}
                      {user?.tier !== "free" && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Billing Cycle</span>
                            <span className="text-sm">Monthly</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Next Payment</span>
                            <span className="text-sm">
                              {user?.trialEndDate ? format(new Date(user.trialEndDate), 'MMMM d, yyyy') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant="outline" className="text-xs">
                              {user?.subscriptionStatus || 'Active'}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          onClick={() => setShowUpgradeModal(true)}
                          className="flex-1"
                          data-testid="button-upgrade-plan"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          {user?.tier === "free" ? "Upgrade to Pro" : "Change Plan"}
                        </Button>
                        <Button 
                          onClick={() => setShowBuyCreditsModal(true)}
                          variant="outline"
                          className="flex-1"
                          data-testid="button-buy-credits"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Buy More Credits
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Billing History */}
                  {billingHistory && billingHistory.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Billing History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {billingHistory.map((transaction: any) => (
                            <div key={transaction.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{transaction.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${transaction.amount}</p>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6">
                  {/* Change Password */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lock className="w-5 h-5" />
                        <span>Change Password</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          data-testid="input-current-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          data-testid="input-new-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          data-testid="input-confirm-password"
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handlePasswordChange}
                        disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword}
                        data-testid="button-change-password"
                      >
                        {changePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Change Email */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Mail className="w-5 h-5" />
                        <span>Change Email Address</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newEmail">New Email Address</Label>
                        <Input
                          id="newEmail"
                          type="email"
                          value={emailData.newEmail}
                          onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                          placeholder="Enter new email address"
                          data-testid="input-new-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmEmail">Confirm Email Address</Label>
                        <Input
                          id="confirmEmail"
                          type="email"
                          value={emailData.confirmEmail}
                          onChange={(e) => setEmailData({ ...emailData, confirmEmail: e.target.value })}
                          placeholder="Confirm new email address"
                          data-testid="input-confirm-email"
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handleEmailChange}
                        disabled={changeEmailMutation.isPending || !emailData.newEmail}
                        data-testid="button-change-email"
                      >
                        {changeEmailMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          "Change Email"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Two-Factor Authentication */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>Two-Factor Authentication</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">Enhance your account security with 2FA</p>
                          <p className="text-xs text-muted-foreground">Coming soon</p>
                        </div>
                        <Button variant="outline" disabled>
                          Enable 2FA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Danger Zone */}
                <TabsContent value="danger" className="space-y-6">
                  <Card className="border-yellow-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-yellow-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Cancel Subscription</span>
                      </CardTitle>
                      <CardDescription>
                        Stop your subscription but keep your account and data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Cancelling your subscription will stop future billing. You'll retain access to your current plan until the end of your billing period.
                      </p>
                      <Button 
                        variant="outline" 
                        className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={user?.tier === "free"}
                        data-testid="button-cancel-subscription"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Subscription
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-red-500">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-red-600">
                        <Trash2 className="w-5 h-5" />
                        <span>Delete Account</span>
                      </CardTitle>
                      <CardDescription>
                        Permanently delete your account and all associated data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. All your data will be permanently removed.
                      </p>
                      <Button 
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        data-testid="button-delete-account"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Plan Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription>
              Select the plan that best fits your needs
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={plan.popular ? "border-primary shadow-lg" : ""}
              >
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground text-center py-1 text-xs font-medium">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleUpgradePlan(plan)}
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    disabled={false}
                    data-testid={`button-select-${plan.id}`}
                  >
                    {(
                      <>Select {plan.name}</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Buy Credits Modal */}
      <Dialog open={showBuyCreditsModal} onOpenChange={setShowBuyCreditsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy Credits</DialogTitle>
            <DialogDescription>
              Add more credits to your account for additional content generation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            {creditPacks.map((pack) => (
              <Card 
                key={pack.credits}
                className={pack.popular ? "border-primary" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold">{pack.credits} Credits</span>
                        {pack.popular && (
                          <Badge variant="secondary">Best Value</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${(pack.price / pack.credits * 100).toFixed(0)}¢ per credit
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleBuyCredits(pack)}
                      variant={pack.popular ? "default" : "outline"}
                      disabled={buyCreditsHandler.isPending && selectedCreditPack?.credits === pack.credits}
                      data-testid={`button-buy-${pack.credits}-credits`}
                    >
                      {buyCreditsHandler.isPending && selectedCreditPack?.credits === pack.credits ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>${pack.price}</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll retain access to your current plan until the end of your billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelSubscriptionMutation.mutate()}
              className="bg-yellow-600 hover:bg-yellow-700"
              disabled={cancelSubscriptionMutation.isPending}
            >
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAccountMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete My Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}