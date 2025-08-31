import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Building, 
  Palette, 
  Bell, 
  Shield, 
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType, Platform } from "@shared/schema";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  const { data: platforms } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const [profileData, setProfileData] = useState({
    fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "",
    businessName: user?.businessName || "",
    avatar: user?.profileImageUrl || "",
  });

  const [brandSettings, setBrandSettings] = useState({
    brandColors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#f59e0b",
    },
    toneOfVoice: "friendly",
    brandKeywords: "",
    logoUrl: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    approvalReminders: true,
    publishingAlerts: true,
  });

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
  });

  const connectPlatformMutation = useMutation({
    mutationFn: async (platformName: string) => {
      return apiRequest("POST", "/api/platforms/connect", { platform: platformName });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Platform connected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
    },
  });

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(profileData);
  };

  const getPlatformIcon = (platform: string) => {
    const iconMap: { [key: string]: string } = {
      "Instagram": "fab fa-instagram text-pink-500",
      "Facebook": "fab fa-facebook text-blue-600",
      "X (Twitter)": "fab fa-twitter text-blue-400",
      "TikTok": "fab fa-tiktok text-gray-800",
      "LinkedIn": "fab fa-linkedin text-blue-700",
    };
    return iconMap[platform] || "fab fa-share text-gray-500";
  };

  const allPlatforms = [
    { name: "Instagram", description: "Connect your Instagram business account" },
    { name: "Facebook", description: "Connect your Facebook page" },
    { name: "X (Twitter)", description: "Connect your Twitter account" },
    { name: "TikTok", description: "Connect your TikTok business account" },
    { name: "LinkedIn", description: "Connect your LinkedIn company page" },
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure your account and platform settings
            </p>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="platforms">Platforms</TabsTrigger>
                <TabsTrigger value="brand">Brand</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {/* Profile Settings */}
                <TabsContent value="profile" className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={profileData.businessName}
                          onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                          placeholder="Enter your business name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar">Profile Picture URL</Label>
                      <Input
                        id="avatar"
                        value={profileData.avatar}
                        onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                        placeholder="Enter profile picture URL"
                      />
                    </div>

                    <Button onClick={handleProfileUpdate} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Security</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <Button variant="outline">Change Password</Button>
                      <Button variant="outline">Two-Factor Authentication</Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Platform Settings */}
                <TabsContent value="platforms" className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Connected Platforms</h3>
                  </div>

                  <div className="space-y-4">
                    {allPlatforms.map((platform) => {
                      const connectedPlatform = platforms?.find(p => p.name === platform.name);
                      const isConnected = connectedPlatform?.isConnected;

                      return (
                        <div
                          key={platform.name}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <i className={getPlatformIcon(platform.name)} />
                            <div>
                              <p className="font-medium text-foreground">{platform.name}</p>
                              <p className="text-sm text-muted-foreground">{platform.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {isConnected ? (
                              <>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Connected
                                </Badge>
                                <Button variant="outline" size="sm">
                                  Disconnect
                                </Button>
                              </>
                            ) : (
                              <>
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Not Connected
                                </Badge>
                                <Button 
                                  size="sm"
                                  onClick={() => connectPlatformMutation.mutate(platform.name)}
                                  disabled={connectPlatformMutation.isPending}
                                >
                                  Connect
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Brand Settings */}
                <TabsContent value="brand" className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Brand Guidelines</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Brand Colors</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="primaryColor">Primary Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="primaryColor"
                              type="color"
                              value={brandSettings.brandColors.primary}
                              onChange={(e) => setBrandSettings({
                                ...brandSettings,
                                brandColors: { ...brandSettings.brandColors, primary: e.target.value }
                              })}
                              className="w-16 h-10"
                            />
                            <Input
                              value={brandSettings.brandColors.primary}
                              onChange={(e) => setBrandSettings({
                                ...brandSettings,
                                brandColors: { ...brandSettings.brandColors, primary: e.target.value }
                              })}
                              placeholder="#3b82f6"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondaryColor">Secondary Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="secondaryColor"
                              type="color"
                              value={brandSettings.brandColors.secondary}
                              onChange={(e) => setBrandSettings({
                                ...brandSettings,
                                brandColors: { ...brandSettings.brandColors, secondary: e.target.value }
                              })}
                              className="w-16 h-10"
                            />
                            <Input
                              value={brandSettings.brandColors.secondary}
                              onChange={(e) => setBrandSettings({
                                ...brandSettings,
                                brandColors: { ...brandSettings.brandColors, secondary: e.target.value }
                              })}
                              placeholder="#64748b"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accentColor">Accent Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="accentColor"
                              type="color"
                              value={brandSettings.brandColors.accent}
                              onChange={(e) => setBrandSettings({
                                ...brandSettings,
                                brandColors: { ...brandSettings.brandColors, accent: e.target.value }
                              })}
                              className="w-16 h-10"
                            />
                            <Input
                              value={brandSettings.brandColors.accent}
                              onChange={(e) => setBrandSettings({
                                ...brandSettings,
                                brandColors: { ...brandSettings.brandColors, accent: e.target.value }
                              })}
                              placeholder="#f59e0b"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        value={brandSettings.logoUrl}
                        onChange={(e) => setBrandSettings({ ...brandSettings, logoUrl: e.target.value })}
                        placeholder="Enter your logo URL"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brandKeywords">Brand Keywords</Label>
                      <Textarea
                        id="brandKeywords"
                        value={brandSettings.brandKeywords}
                        onChange={(e) => setBrandSettings({ ...brandSettings, brandKeywords: e.target.value })}
                        placeholder="Enter keywords that represent your brand (e.g., coffee, cozy, local, artisan)"
                        rows={3}
                      />
                    </div>

                    <Button>Save Brand Settings</Button>
                  </div>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Notification Preferences</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Get push notifications on your device</p>
                        </div>
                        <Switch
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Weekly Reports</p>
                          <p className="text-sm text-muted-foreground">Receive weekly performance summaries</p>
                        </div>
                        <Switch
                          checked={notificationSettings.weeklyReports}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, weeklyReports: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Approval Reminders</p>
                          <p className="text-sm text-muted-foreground">Get notified when content needs approval</p>
                        </div>
                        <Switch
                          checked={notificationSettings.approvalReminders}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, approvalReminders: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Publishing Alerts</p>
                          <p className="text-sm text-muted-foreground">Get alerts when posts are published</p>
                        </div>
                        <Switch
                          checked={notificationSettings.publishingAlerts}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, publishingAlerts: checked })
                          }
                        />
                      </div>
                    </div>

                    <Button>Save Notification Settings</Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
