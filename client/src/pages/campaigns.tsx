import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { 
  PlusCircle, 
  Calendar as CalendarIcon, 
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image,
  FileText,
  Trash2,
  Eye,
  Play,
  CreditCard,
  Upload,
  Sparkles
} from "lucide-react";
import type { Campaign, Post } from "@shared/schema";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  businessName: z.string().min(1, "Business name is required"),
  productName: z.string().optional(),
  targetAudience: z.string().min(1, "Target audience is required"),
  campaignGoals: z.string().min(1, "Campaign goals are required"),
  brandTone: z.string().min(1, "Brand tone is required"),
  keyMessages: z.string().optional(),
  callToAction: z.string().min(1, "Call to action is required"),
  contentType: z.enum(["text", "image"]),
  postingSchedule: z.enum(["auto", "manual"]),
  manualTimes: z.array(z.object({
    hour: z.string(),
    minute: z.string()
  })).optional(),
  startDate: z.string().min(1, "Start date is required"),
});

type CreateCampaignForm = z.infer<typeof createCampaignSchema>;

// Best posting times for social media engagement
const BEST_POSTING_TIMES = [
  { hour: 9, minute: 0 },   // 9:00 AM
  { hour: 19, minute: 0 },  // 7:00 PM
];

interface CampaignPost {
  id: string;
  day: number;
  slot: number;
  content: string;
  imageUrl?: string;
  scheduledTime: Date;
  status: "pending" | "approved" | "deleted";
  platforms: string[];
}

export default function Campaigns() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignPosts, setCampaignPosts] = useState<CampaignPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string }>({});
  const [manualContent, setManualContent] = useState<{ [key: string]: string }>({});
  
  const form = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      platforms: [],
      businessName: "",
      productName: "",
      targetAudience: "",
      campaignGoals: "",
      brandTone: "professional",
      keyMessages: "",
      callToAction: "",
      contentType: "text",
      postingSchedule: "auto",
      manualTimes: [
        { hour: "9", minute: "00" },
        { hour: "19", minute: "00" }
      ],
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: approvalQueue } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns/approval-queue"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CreateCampaignForm) => {
      // Check if user is paid
      if (!user?.isPaid) {
        throw new Error("Campaign creation requires a paid account");
      }

      setIsGenerating(true);
      
      // Generate all 14 posts at once
      const posts: CampaignPost[] = [];
      const startDate = new Date(data.startDate);
      
      for (let day = 0; day < 7; day++) {
        for (let slot = 0; slot < 2; slot++) {
          const postDate = addDays(startDate, day);
          let scheduledTime: Date;
          
          if (data.postingSchedule === "auto") {
            const time = BEST_POSTING_TIMES[slot];
            scheduledTime = setMinutes(setHours(postDate, time.hour), time.minute);
          } else {
            const time = data.manualTimes?.[slot] || BEST_POSTING_TIMES[slot];
            scheduledTime = setMinutes(setHours(postDate, parseInt(time.hour)), parseInt(time.minute));
          }
          
          posts.push({
            id: `post-${day}-${slot}`,
            day: day + 1,
            slot: slot + 1,
            content: "",
            scheduledTime,
            status: "pending",
            platforms: data.platforms,
          });
        }
      }
      
      // Create campaign
      const response = await apiRequest("POST", "/api/campaigns", {
        ...data,
        postsPerDay: 2,
        totalPosts: 14,
        status: "generating",
      });
      
      const campaign = await response.json();
      
      // Generate content for all posts
      const generatedPosts = await apiRequest("POST", `/api/campaigns/${campaign.id}/generate-all`, {
        posts,
        contentType: data.contentType,
        businessName: data.businessName,
        productName: data.productName,
        targetAudience: data.targetAudience,
        brandTone: data.brandTone,
        keyMessages: data.keyMessages,
        callToAction: data.callToAction,
      });
      
      return { campaign, posts: await generatedPosts.json() };
    },
    onSuccess: ({ campaign, posts }) => {
      setCampaignPosts(posts);
      setSelectedCampaign(campaign);
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Campaign created",
        description: "All 14 posts have been generated. Please review and approve them.",
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const approvePostMutation = useMutation({
    mutationFn: async ({ campaignId, postId }: { campaignId: string; postId: string }) => {
      const response = await apiRequest("PATCH", `/api/campaigns/${campaignId}/posts/${postId}`, { 
        status: "approved" 
      });
      return response.json();
    },
    onSuccess: (_, { postId }) => {
      setCampaignPosts(prev => 
        prev.map(post => 
          post.id === postId ? { ...post, status: "approved" } : post
        )
      );
      toast({
        title: "Post approved",
        description: "The post has been approved for publishing.",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async ({ campaignId, postId }: { campaignId: string; postId: string }) => {
      const response = await apiRequest("DELETE", `/api/campaigns/${campaignId}/posts/${postId}`);
      return response.json();
    },
    onSuccess: (_, { postId }) => {
      setCampaignPosts(prev => 
        prev.map(post => 
          post.id === postId ? { ...post, status: "deleted" } : post
        )
      );
      toast({
        title: "Post deleted",
        description: "The post has been removed from the campaign.",
      });
    },
  });

  const approveCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/approval-queue"] });
      toast({
        title: "Campaign approved",
        description: "The campaign has been approved and will start posting automatically.",
      });
      setSelectedCampaign(null);
    },
  });

  const handleImageUpload = (postId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => ({
          ...prev,
          [postId]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualContentChange = (postId: string, content: string) => {
    setManualContent(prev => ({
      ...prev,
      [postId]: content
    }));
  };

  const activeCampaigns = campaigns?.filter(c => c.status === "active") || [];
  const pendingApproval = approvalQueue || [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Create 7-day automated campaigns with up to 14 posts
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={!user?.isPaid}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {!user?.isPaid && (
        <Alert>
          <CreditCard className="w-4 h-4" />
          <AlertDescription>
            Campaign creation requires a paid account. Upgrade to create automated campaigns.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active Campaigns ({activeCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="approval">
            Pending Approval ({pendingApproval.length})
          </TabsTrigger>
          <TabsTrigger value="calendar">
            Campaign Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>
                      {campaign.platforms.join(", ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{campaign.generationProgress || 0}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Posts</span>
                        <span>{campaign.totalPosts || 14} total</span>
                      </div>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approval" className="space-y-4">
          {pendingApproval.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No campaigns pending approval</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingApproval.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{campaign.name}</CardTitle>
                        <CardDescription>
                          {campaign.platforms.join(", ")} • 14 posts ready
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => approveCampaignMutation.mutate(campaign.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Approve & Start Campaign
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          {selectedCampaign && campaignPosts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedCampaign.name} - 7 Day Calendar</CardTitle>
                <CardDescription>
                  Review and approve individual posts before launching the campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-4">
                  {[...Array(7)].map((_, dayIndex) => {
                    const dayPosts = campaignPosts.filter(p => p.day === dayIndex + 1);
                    return (
                      <div key={dayIndex} className="border rounded-lg p-4">
                        <div className="font-semibold mb-3 text-center">
                          Day {dayIndex + 1}
                        </div>
                        {dayPosts.map((post) => (
                          <div key={post.id} className="mb-4 p-3 border rounded">
                            <div className="text-xs text-muted-foreground mb-2">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {format(post.scheduledTime, "h:mm a")}
                            </div>
                            
                            {post.content ? (
                              <p className="text-sm mb-2 line-clamp-3">{post.content}</p>
                            ) : (
                              <div className="space-y-2 mb-2">
                                <Textarea
                                  placeholder="Enter post content..."
                                  value={manualContent[post.id] || ""}
                                  onChange={(e) => handleManualContentChange(post.id, e.target.value)}
                                  className="text-sm h-20"
                                />
                              </div>
                            )}
                            
                            {post.imageUrl && (
                              <img 
                                src={post.imageUrl} 
                                alt="Post" 
                                className="w-full h-20 object-cover rounded mb-2"
                              />
                            )}
                            
                            {!post.imageUrl && uploadedImages[post.id] && (
                              <img 
                                src={uploadedImages[post.id]} 
                                alt="Uploaded" 
                                className="w-full h-20 object-cover rounded mb-2"
                              />
                            )}
                            
                            {form.watch("contentType") === "image" && !post.imageUrl && !uploadedImages[post.id] && (
                              <div className="mb-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(post.id, e)}
                                  className="hidden"
                                  id={`upload-${post.id}`}
                                />
                                <label htmlFor={`upload-${post.id}`}>
                                  <Button variant="outline" size="sm" asChild>
                                    <span>
                                      <Upload className="w-3 h-3 mr-1" />
                                      Upload
                                    </span>
                                  </Button>
                                </label>
                              </div>
                            )}
                            
                            <div className="flex gap-1">
                              {post.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => approvePostMutation.mutate({
                                      campaignId: selectedCampaign.id,
                                      postId: post.id
                                    })}
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => deletePostMutation.mutate({
                                      campaignId: selectedCampaign.id,
                                      postId: post.id
                                    })}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                              {post.status === "approved" && (
                                <Badge className="w-full justify-center bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                              {post.status === "deleted" && (
                                <Badge className="w-full justify-center bg-red-500">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Deleted
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={() => approveCampaignMutation.mutate(selectedCampaign.id)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={campaignPosts.filter(p => p.status === "approved").length === 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Send to Approval Queue
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Create a campaign to see the calendar view</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create 7-Day Campaign</DialogTitle>
            <DialogDescription>
              Generate 14 posts (2 per day) for a week-long campaign
            </DialogDescription>
          </DialogHeader>

          {isGenerating && (
            <Alert>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertDescription>
                <strong>Generating your campaign...</strong><br />
                This may take a few minutes as we're creating 14 unique posts with AI.
                {form.watch("contentType") === "image" && " Images are being generated for each post."}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createCampaignMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer Sale Campaign" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platforms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platforms</FormLabel>
                    <FormDescription>
                      Select one or more platforms to post to
                    </FormDescription>
                    <div className="grid grid-cols-3 gap-4">
                      {["Instagram", "Facebook", "X (Twitter)", "LinkedIn", "TikTok"].map((platform) => (
                        <label key={platform} className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(platform)}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...(field.value || []), platform]
                                : (field.value || []).filter((p) => p !== platform);
                              field.onChange(updated);
                            }}
                          />
                          <span className="text-sm">{platform}</span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product/Service</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Young professionals interested in tech..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaignGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Goals</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Increase brand awareness, drive traffic..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="brandTone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="inspirational">Inspirational</SelectItem>
                          <SelectItem value="humorous">Humorous</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">
                            <FileText className="w-4 h-4 inline mr-2" />
                            Text Only
                          </SelectItem>
                          <SelectItem value="image">
                            <Image className="w-4 h-4 inline mr-2" />
                            Image + Text
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="keyMessages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Messages</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Limited time offer, Free shipping, Premium quality..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="callToAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call to Action</FormLabel>
                    <FormControl>
                      <Input placeholder="Shop Now, Learn More, Sign Up..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postingSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posting Schedule</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auto" id="auto" />
                        <label htmlFor="auto" className="text-sm font-normal">
                          Auto (posts at optimal times: 9 AM & 7 PM)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <label htmlFor="manual" className="text-sm font-normal">
                          Manual (choose your times)
                        </label>
                      </div>
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("postingSchedule") === "manual" && (
                <div className="space-y-2">
                  <FormLabel>Manual Posting Times</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">First Post Time</label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          min="0" 
                          max="23" 
                          placeholder="09"
                          value={form.watch("manualTimes.0.hour")}
                          onChange={(e) => form.setValue("manualTimes.0.hour", e.target.value)}
                        />
                        <span>:</span>
                        <Input 
                          type="number" 
                          min="0" 
                          max="59" 
                          placeholder="00"
                          value={form.watch("manualTimes.0.minute")}
                          onChange={(e) => form.setValue("manualTimes.0.minute", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Second Post Time</label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          min="0" 
                          max="23" 
                          placeholder="19"
                          value={form.watch("manualTimes.1.hour")}
                          onChange={(e) => form.setValue("manualTimes.1.hour", e.target.value)}
                        />
                        <span>:</span>
                        <Input 
                          type="number" 
                          min="0" 
                          max="59" 
                          placeholder="00"
                          value={form.watch("manualTimes.1.minute")}
                          onChange={(e) => form.setValue("manualTimes.1.minute", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Campaign will run for 7 days with 2 posts per day (14 total posts)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Note:</strong> Campaign creation may take several minutes as we generate 
                  {form.watch("contentType") === "image" ? " 14 unique images and" : ""} 14 text captions 
                  optimized for your selected platforms.
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCampaignMutation.isPending || isGenerating || !user?.isPaid}
                >
                  {(createCampaignMutation.isPending || isGenerating) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Campaign (14 Credits)
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}