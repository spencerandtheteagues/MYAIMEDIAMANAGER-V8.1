import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, X, Check, Bot, Image, Video } from "lucide-react";
import type { Post } from "@shared/schema";

interface ApprovalItemProps {
  post: Post;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

export default function ApprovalItem({ post, onApprove, onReject, isProcessing }: ApprovalItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
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

  return (
    <Card className={`border-2 ${post.status === "pending" ? "border-amber-200 bg-amber-50/30" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              {post.platforms.map((platform) => (
                <i key={platform} className={getPlatformIcon(platform)} />
              ))}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {post.content.slice(0, 30)}...
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Created {formatTimeAgo(post.createdAt!)}</span>
                {post.aiGenerated && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Bot className="w-3 h-3" />
                      <span>AI Generated</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(post.status)}>
            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </Badge>
        </div>

        <div className="mb-4">
          <p className="text-foreground mb-2">{post.content}</p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <span className="flex items-center space-x-1">
                {post.mediaUrls[0].includes('video') ? (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Video attached</span>
                  </>
                ) : (
                  <>
                    <Image className="w-4 h-4" />
                    <span>Image attached</span>
                  </>
                )}
              </span>
            )}
            {post.scheduledFor && (
              <>
                <span>•</span>
                <span>
                  Scheduled for: {new Date(post.scheduledFor).toLocaleDateString('en-US', {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Button variant="link" size="sm" className="p-0 h-auto">
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button variant="link" size="sm" className="p-0 h-auto">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
          
          {post.status === "pending" && (
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                disabled={isProcessing}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={onApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-1" />
                Approve & Schedule
              </Button>
            </div>
          )}

          {post.status === "rejected" && post.rejectionReason && (
            <div className="text-sm text-destructive">
              Rejected: {post.rejectionReason}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
