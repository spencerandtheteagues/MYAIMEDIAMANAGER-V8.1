import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PostCard from "@/components/content/post-card";
import type { Post } from "@shared/schema";

export default function Approval() {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
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
        title: "Post Approved",
        description: "The post has been approved and will be published as scheduled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      return apiRequest("PATCH", `/api/posts/${postId}`, { 
        status: "rejected",
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Post Rejected",
        description: "The post has been rejected with feedback.",
      });
      setShowRejectDialog(false);
      setSelectedPost(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const handleApprove = (postId: string) => {
    approveMutation.mutate(postId);
  };

  const handleReject = (postId: string) => {
    setSelectedPost(postId);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (selectedPost && rejectReason.trim()) {
      rejectMutation.mutate({ 
        postId: selectedPost, 
        reason: rejectReason 
      });
    }
  };

  const handleEdit = (postId: string) => {
    toast({
      title: "Edit Post",
      description: "Opening post editor...",
    });
  };

  const handlePreview = (postId: string) => {
    toast({
      title: "Preview",
      description: "Opening post preview...",
    });
  };

  const stats = {
    pending: pendingPosts?.length || 0,
    approved: approvedPosts?.length || 0,
    rejected: rejectedPosts?.length || 0,
  };

  const renderPosts = (posts: Post[] | undefined, loading: boolean, showActions: boolean = true) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-t-lg" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No posts in this category
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Content will appear here when available
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            showActions={showActions}
            onApprove={post.status === "pending" ? handleApprove : undefined}
            onReject={post.status === "pending" ? handleReject : undefined}
            onEdit={handleEdit}
            onPreview={handlePreview}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Approval Queue</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve content before it goes live
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Clock className="w-5 h-5 mr-2" />
          {stats.pending} Pending
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600 dark:text-yellow-400 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600 dark:text-green-400 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-600 dark:text-red-400 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending">
            Pending {stats.pending > 0 && `(${stats.pending})`}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved {stats.approved > 0 && `(${stats.approved})`}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected {stats.rejected > 0 && `(${stats.rejected})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {renderPosts(pendingPosts, pendingLoading, true)}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {renderPosts(approvedPosts, approvedLoading, false)}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {renderPosts(rejectedPosts, rejectedLoading, false)}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Post</DialogTitle>
            <DialogDescription>
              Please provide feedback for why this post is being rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              className="mt-2 h-32"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
                setSelectedPost(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}