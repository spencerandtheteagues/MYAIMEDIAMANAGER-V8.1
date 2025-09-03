import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Edit, 
  BarChart3, 
  Copy, 
  Trash2, 
  MoreVertical,
  Plus,
  Image,
  Video,
  Search,
  Download,
  Eye,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Post, ContentLibrary } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Library() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [mediaType, setMediaType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for posts
  const { data: allPosts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  // Query for content library media
  const { data: mediaItems, isLoading: mediaLoading } = useQuery<ContentLibrary[]>({
    queryKey: ["/api/content-library"],
  });

  // Mutations for posts
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const duplicatePostMutation = useMutation({
    mutationFn: async (post: Post) => {
      return apiRequest("POST", "/api/posts", {
        content: post.content + " (Copy)",
        platforms: post.platforms,
        status: "draft",
        mediaUrls: post.mediaUrls,
        aiGenerated: post.aiGenerated,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post duplicated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("PATCH", `/api/posts/${postId}`, {
        status: "published",
        publishedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post published successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  // Mutations for media
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      return apiRequest("DELETE", `/api/content-library/${mediaId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Media deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content-library"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      });
    },
  });

  // Filter posts based on selected status
  const filteredPosts = allPosts?.filter(post => {
    if (filterStatus === "all") return true;
    if (filterStatus === "drafts") return post.status === "draft";
    if (filterStatus === "published") return post.status === "published";
    if (filterStatus === "scheduled") return post.status === "scheduled";
    return true;
  }) || [];

  // Filter media based on type and search
  const filteredMedia = mediaItems?.filter(item => {
    const matchesType = mediaType === "all" || item.type === mediaType;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.metadata as any)?.prompt?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "published":
        return "bg-green-100 text-green-800 border-green-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
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

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (postsLoading || mediaLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-muted rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Library</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all your content and media assets
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="posts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Posts ({filteredPosts.length})
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Media ({filteredMedia.length})
              </TabsTrigger>
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4">
              <div className="flex items-center justify-between">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="option-all">All Content</SelectItem>
                    <SelectItem value="drafts" data-testid="option-drafts">Drafts</SelectItem>
                    <SelectItem value="published" data-testid="option-published">Published</SelectItem>
                    <SelectItem value="scheduled" data-testid="option-scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
                <Button data-testid="button-new-draft">
                  <Plus className="w-4 h-4 mr-2" />
                  New Draft
                </Button>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {filterStatus === "all" 
                      ? "No content found. Create your first post to get started."
                      : `No ${filterStatus} posts found.`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map((post) => {
                    const imageUrl = post.metadata?.imageUrl || post.mediaUrls?.find(url => url.includes('image'));
                    const videoUrl = post.metadata?.videoUrl || post.mediaUrls?.find(url => url.includes('video'));
                    
                    return (
                      <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`post-card-${post.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={getStatusColor(post.status)}>
                                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                              </Badge>
                              <div className="flex space-x-1">
                                {post.platforms.slice(0, 3).map((platform) => (
                                  <i key={platform} className={`${getPlatformIcon(platform)} text-sm`} />
                                ))}
                                {post.platforms.length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{post.platforms.length - 3}</span>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-more-${post.id}`}>
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem data-testid={`menu-edit-${post.id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicatePostMutation.mutate(post)} data-testid={`menu-duplicate-${post.id}`}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                {post.status === "published" && (
                                  <DropdownMenuItem data-testid={`menu-analytics-${post.id}`}>
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    View Analytics
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => deletePostMutation.mutate(post.id)}
                                  className="text-destructive"
                                  data-testid={`menu-delete-${post.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Media Preview */}
                          {(imageUrl || videoUrl) && (
                            <div className="mb-3 rounded-lg overflow-hidden bg-muted aspect-video relative">
                              {imageUrl && (
                                <img 
                                  src={imageUrl} 
                                  alt="Content preview" 
                                  className="w-full h-full object-cover"
                                />
                              )}
                              {videoUrl && !imageUrl && (
                                <video 
                                  src={videoUrl} 
                                  className="w-full h-full object-cover"
                                  controls={false}
                                  muted
                                />
                              )}
                              <div className="absolute top-2 right-2">
                                {imageUrl && (
                                  <Badge className="bg-black/50 text-white">
                                    <Image className="w-3 h-3 mr-1" />
                                    Image
                                  </Badge>
                                )}
                                {videoUrl && (
                                  <Badge className="bg-black/50 text-white">
                                    <Video className="w-3 h-3 mr-1" />
                                    Video
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <p className="text-foreground mb-2 line-clamp-3 text-sm">
                            {post.content}
                          </p>

                          <div className="text-xs text-muted-foreground mb-3">
                            {post.status === "published" && post.publishedAt && (
                              <>
                                Published {formatTimeAgo(post.publishedAt)}
                                {post.engagementData && (
                                  <span className="ml-2">
                                    • {post.engagementData.likes + post.engagementData.comments + post.engagementData.shares} engagements
                                  </span>
                                )}
                              </>
                            )}
                            {post.status === "scheduled" && post.scheduledFor && (
                              <>
                                Scheduled for {new Date(post.scheduledFor).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </>
                            )}
                            {(post.status === "draft" || post.status === "pending") && (
                              <>Created {formatTimeAgo(post.createdAt!)}</>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            {post.status === "draft" ? (
                              <>
                                <Button variant="link" size="sm" className="p-0 h-auto" data-testid={`button-edit-${post.id}`}>
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => publishMutation.mutate(post.id)}
                                  disabled={publishMutation.isPending}
                                  data-testid={`button-publish-${post.id}`}
                                >
                                  Publish
                                </Button>
                              </>
                            ) : post.status === "published" ? (
                              <>
                                <Button variant="link" size="sm" className="p-0 h-auto" data-testid={`button-view-analytics-${post.id}`}>
                                  <BarChart3 className="w-3 h-3 mr-1" />
                                  View Analytics
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => duplicatePostMutation.mutate(post)}
                                  data-testid={`button-duplicate-${post.id}`}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Duplicate
                                </Button>
                              </>
                            ) : post.status === "scheduled" ? (
                              <>
                                <Button variant="link" size="sm" className="p-0 h-auto" data-testid={`button-edit-scheduled-${post.id}`}>
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" data-testid={`button-reschedule-${post.id}`}>
                                  <Edit className="w-3 h-3 mr-1" />
                                  Reschedule
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search media..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-media"
                    />
                  </div>
                  <Select value={mediaType} onValueChange={setMediaType}>
                    <SelectTrigger className="w-[150px]" data-testid="select-media-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="option-all-media">All Media</SelectItem>
                      <SelectItem value="image" data-testid="option-images">Images</SelectItem>
                      <SelectItem value="video" data-testid="option-videos">Videos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredMedia.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? `No media found matching "${searchTerm}"`
                      : mediaType === "all"
                        ? "No media in your library yet. Generated images and videos will appear here."
                        : `No ${mediaType}s in your library yet.`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMedia.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow overflow-hidden" data-testid={`media-card-${item.id}`}>
                      <div className="aspect-video relative bg-muted">
                        {item.type === "image" ? (
                          <img 
                            src={item.url} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video 
                            src={item.url}
                            className="w-full h-full object-cover"
                            controls={false}
                            muted
                          />
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black/50 text-white">
                            {item.type === "image" ? (
                              <><Image className="w-3 h-3 mr-1" />Image</>
                            ) : (
                              <><Video className="w-3 h-3 mr-1" />Video</>
                            )}
                          </Badge>
                        </div>
                        {(item.metadata as any)?.aiGenerated && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-purple-500/90 text-white">
                              AI Generated
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm mb-1 truncate">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatFileSize(item.size)} • {formatTimeAgo(item.createdAt!)}
                        </p>
                        {(item.metadata as any)?.prompt && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            Prompt: {(item.metadata as any).prompt}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 px-2" data-testid={`button-view-${item.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => window.open(item.url, '_blank')}
                              data-testid={`button-download-${item.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-destructive"
                            onClick={() => deleteMediaMutation.mutate(item.id)}
                            data-testid={`button-delete-media-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}