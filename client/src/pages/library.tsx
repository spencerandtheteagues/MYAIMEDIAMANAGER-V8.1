import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit, 
  BarChart3, 
  Copy, 
  Trash2, 
  MoreVertical,
  Plus,
  Image,
  Video
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Post } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Library() {
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allPosts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const deleteMutation = useMutation({
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

  const duplicateMutation = useMutation({
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

  // Filter posts based on selected status
  const filteredPosts = allPosts?.filter(post => {
    if (filterStatus === "all") return true;
    if (filterStatus === "drafts") return post.status === "draft";
    if (filterStatus === "published") return post.status === "published";
    if (filterStatus === "scheduled") return post.status === "scheduled";
    return true;
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

  if (isLoading) {
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
                Manage all your content drafts and published posts
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="drafts">Drafts</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Draft
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
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
              {filteredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateMutation.mutate(post)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {post.status === "published" && (
                            <DropdownMenuItem>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(post.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-foreground mb-2 line-clamp-3 text-sm">
                      {post.content}
                    </p>

                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className="flex items-center space-x-1 mb-3 text-xs text-muted-foreground">
                        {post.mediaUrls[0].includes('video') ? (
                          <>
                            <Video className="w-3 h-3" />
                            <span>Video attached</span>
                          </>
                        ) : (
                          <>
                            <Image className="w-3 h-3" />
                            <span>Image attached</span>
                          </>
                        )}
                      </div>
                    )}

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
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => publishMutation.mutate(post.id)}
                            disabled={publishMutation.isPending}
                          >
                            Publish
                          </Button>
                        </>
                      ) : post.status === "published" ? (
                        <>
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            View Analytics
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => duplicateMutation.mutate(post)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Duplicate
                          </Button>
                        </>
                      ) : post.status === "scheduled" ? (
                        <>
                          <Button variant="link" size="sm" className="p-0 h-auto">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            Reschedule
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
