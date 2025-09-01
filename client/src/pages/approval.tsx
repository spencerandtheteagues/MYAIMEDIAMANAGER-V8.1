import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Post } from "@shared/schema";
import ApprovalItem from "../components/content/approval-item";

export default function Approval() {
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingPosts, isLoading: pendingLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "pending"],
  });

  const { data: approvedPosts, isLoading: approvedLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "approved"],
  });

  const { data: rejectedPosts, isLoading: rejectedLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "rejected"],
  });

  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("PATCH", `/api/posts/${postId}`, {
        status: "approved",
        approvedBy: "demo-user-1",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post approved and scheduled for publishing!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason?: string }) => {
      return apiRequest("PATCH", `/api/posts/${postId}`, {
        status: "rejected",
        rejectionReason: reason || "Content does not meet brand guidelines",
      });
    },
    onSuccess: () => {
      toast({
        title: "Post Rejected",
        description: "The post has been rejected with feedback.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const renderPosts = (posts: Post[] | undefined, loading: boolean) => {
    if (loading) {
      return (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse border border-border rounded-lg p-6">
              <div className="h-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts found in this category.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {posts.map((post) => (
          <ApprovalItem
            key={post.id}
            post={post}
            onApprove={() => approveMutation.mutate(post.id)}
            onReject={() => rejectMutation.mutate({ postId: post.id })}
            isProcessing={approveMutation.isPending || rejectMutation.isPending}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Content Approval Queue</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and approve content before publishing
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {pendingPosts?.length || 0} Pending
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Pending ({pendingPosts?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({approvedPosts?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({rejectedPosts?.length || 0})
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="pending">
                  {renderPosts(pendingPosts, pendingLoading)}
                </TabsContent>

                <TabsContent value="approved">
                  {renderPosts(approvedPosts, approvedLoading)}
                </TabsContent>

                <TabsContent value="rejected">
                  {renderPosts(rejectedPosts, rejectedLoading)}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
