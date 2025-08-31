import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  PlusCircle, 
  Rocket, 
  Calendar as CalendarIcon, 
  Target, 
  Palette, 
  MessageSquare,
  Loader2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Sparkles
} from "lucide-react";
import type { Campaign, Post } from "@shared/schema";
import PostCard from "@/components/content/post-card";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  platform: z.string().min(1, "Platform is required"),
  businessName: z.string().min(1, "Business name is required"),
  productName: z.string().optional(),
  targetAudience: z.string().min(1, "Target audience is required"),
  campaignGoals: z.string().min(1, "Campaign goals are required"),
  brandTone: z.string().min(1, "Brand tone is required"),
  keyMessages: z.array(z.string()).default([]),
  visualStyle: z.string().min(1, "Visual style is required"),
  colorScheme: z.string().optional(),
  callToAction: z.string().min(1, "Call to action is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

type CreateCampaignForm = z.infer<typeof createCampaignSchema>;

export default function Campaigns() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [keyMessageInput, setKeyMessageInput] = useState("");
  
  const form = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      platform: "",
      businessName: "",
      productName: "",
      targetAudience: "",
      campaignGoals: "",
      brandTone: "",
      keyMessages: [],
      visualStyle: "",
      colorScheme: "",
      callToAction: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: campaignPosts } = useQuery<Post[]>({
    queryKey: ["/api/campaigns", selectedCampaign?.id, "posts"],
    enabled: !!selectedCampaign,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CreateCampaignForm) => {
      const response = await apiRequest("POST", "/api/campaigns", {
        ...data,
        postsPerDay: 2,
        status: "draft",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/generate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaign?.id, "posts"] });
      toast({
        title: "Generation started",
        description: "AI is generating content for your campaign. This may take a few minutes.",
      });
    },
  });

  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/campaigns/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign updated",
        description: "Campaign status has been updated.",
      });
    },
  });

  const approvePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("PATCH", `/api/posts/${postId}`, { 
        status: "approved" 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", selectedCampaign?.id, "posts"] });
      toast({
        title: "Post approved",
        description: "The post has been approved for publishing.",
      });
    },
  });

  const handleAddKeyMessage = () => {
    if (keyMessageInput.trim()) {
      const currentMessages = form.getValues("keyMessages");
      form.setValue("keyMessages", [...currentMessages, keyMessageInput.trim()]);
      setKeyMessageInput("");
    }
  };

  const handleRemoveKeyMessage = (index: number) => {
    const currentMessages = form.getValues("keyMessages");
    form.setValue("keyMessages", currentMessages.filter((_, i) => i !== index));
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "generating": return "bg-blue-500";
      case "review": return "bg-yellow-500";
      case "active": return "bg-green-500";
      case "completed": return "bg-purple-500";
      case "paused": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const activeCampaigns = campaigns?.filter(c => c.status === "active") || [];
  const draftCampaigns = campaigns?.filter(c => c.status === "draft") || [];
  const reviewCampaigns = campaigns?.filter(c => c.status === "review") || [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage automated content campaigns
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Drafts ({draftCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="review">
            Review ({reviewCampaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Rocket className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onView={() => {
                    setSelectedCampaign(campaign);
                    setIsPreviewOpen(true);
                  }}
                  onStatusChange={(status) => 
                    updateCampaignStatusMutation.mutate({ id: campaign.id, status })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draftCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Edit className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No draft campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {draftCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onView={() => {
                    setSelectedCampaign(campaign);
                    setIsPreviewOpen(true);
                  }}
                  onGenerate={() => generateCampaignMutation.mutate(campaign.id)}
                  onStatusChange={(status) => 
                    updateCampaignStatusMutation.mutate({ id: campaign.id, status })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          {reviewCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No campaigns in review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviewCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onView={() => {
                    setSelectedCampaign(campaign);
                    setIsPreviewOpen(true);
                  }}
                  onStatusChange={(status) => 
                    updateCampaignStatusMutation.mutate({ id: campaign.id, status })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up an automated campaign that generates and schedules content
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createCampaignMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="X">X (Twitter)</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your campaign objectives..." 
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
                      <FormLabel>Product/Service Name</FormLabel>
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
                        placeholder="Young professionals aged 25-40 interested in sustainable living..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Describe your ideal customer demographics and interests
                    </FormDescription>
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
                        placeholder="Increase brand awareness, drive website traffic, generate leads..." 
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
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="inspirational">Inspirational</SelectItem>
                          <SelectItem value="humorous">Humorous</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visualStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visual Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                          <SelectItem value="colorful">Colorful</SelectItem>
                          <SelectItem value="vintage">Vintage</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="artistic">Artistic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="colorScheme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Scheme</FormLabel>
                    <FormControl>
                      <Input placeholder="Blue and white, earth tones, vibrant rainbow..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Describe your preferred color palette
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Key Messages</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add a key message..."
                    value={keyMessageInput}
                    onChange={(e) => setKeyMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddKeyMessage();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddKeyMessage}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.watch("keyMessages").map((message, index) => (
                    <Badge key={index} variant="secondary">
                      {message}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyMessage(index)}
                        className="ml-2 text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="callToAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call to Action</FormLabel>
                    <FormControl>
                      <Input placeholder="Shop Now, Learn More, Sign Up Today..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Campaign will run for 7 days with 2 posts per day (14 total)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCampaignMutation.isPending}>
                  {createCampaignMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Campaign
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Campaign Preview Dialog */}
      {selectedCampaign && (
        <CampaignPreviewDialog
          campaign={selectedCampaign}
          posts={campaignPosts || []}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onApprovePost={approvePostMutation.mutate}
        />
      )}
    </div>
  );
}

interface CampaignCardProps {
  campaign: Campaign;
  onView: () => void;
  onGenerate?: () => void;
  onStatusChange: (status: string) => void;
}

function CampaignCard({ campaign, onView, onGenerate, onStatusChange }: CampaignCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
            <CardDescription className="mt-1">
              {campaign.platform} • {campaign.postsPerDay * 7} posts
            </CardDescription>
          </div>
          <Badge className={getCampaignStatusColor(campaign.status)}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {campaign.description || "No description"}
          </div>
          
          {campaign.status === "generating" && (
            <Progress value={campaign.generationProgress} className="h-2" />
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Starts {format(new Date(campaign.startDate), "MMM d")}</span>
            <span>{campaign.businessName}</span>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onView}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            
            {campaign.status === "draft" && onGenerate && (
              <Button size="sm" onClick={onGenerate}>
                <Sparkles className="w-4 h-4 mr-1" />
                Generate
              </Button>
            )}
            
            {campaign.status === "review" && (
              <Button size="sm" onClick={() => onStatusChange("active")}>
                <Play className="w-4 h-4 mr-1" />
                Activate
              </Button>
            )}
            
            {campaign.status === "active" && (
              <Button size="sm" variant="outline" onClick={() => onStatusChange("paused")}>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CampaignPreviewDialogProps {
  campaign: Campaign;
  posts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onApprovePost: (postId: string) => void;
}

function CampaignPreviewDialog({ 
  campaign, 
  posts, 
  isOpen, 
  onClose, 
  onApprovePost 
}: CampaignPreviewDialogProps) {
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<{ [key: string]: string }>({});

  const handleEditPost = (postId: string, content: string) => {
    setEditingPost(postId);
    setEditedContent({ ...editedContent, [postId]: content });
  };

  const handleSaveEdit = async (postId: string) => {
    await apiRequest("PATCH", `/api/posts/${postId}`, {
      content: editedContent[postId],
    });
    setEditingPost(null);
    queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaign.id, "posts"] });
  };

  const handleApprovePost = async (postId: string) => {
    await apiRequest("PATCH", `/api/posts/${postId}`, {
      status: "approved",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaign.id, "posts"] });
  };

  const handleRejectPost = async (postId: string) => {
    await apiRequest("PATCH", `/api/posts/${postId}`, {
      status: "rejected",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaign.id, "posts"] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription>
            Preview and manage campaign posts
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <div key={post.id} className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-medium">
                    Day {Math.floor(index / 2) + 1} - Post {(index % 2) + 1}
                  </span>
                  {post.scheduledFor && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(post.scheduledFor), "MMM d")}
                    </span>
                  )}
                </div>
                <PostCard
                  post={post}
                  showActions={true}
                  onEdit={() => handleEditPost(post.id, post.content)}
                  onApprove={post.status === "pending" ? async () => {
                    await handleApprovePost(post.id);
                  } : undefined}
                  onReject={post.status === "pending" ? async () => {
                    await handleRejectPost(post.id);
                  } : undefined}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getCampaignStatusColor(status: string) {
  switch (status) {
    case "draft": return "";
    case "generating": return "bg-blue-500";
    case "review": return "bg-yellow-500";
    case "active": return "bg-green-500";
    case "completed": return "bg-purple-500";
    case "paused": return "bg-orange-500";
    default: return "";
  }
}