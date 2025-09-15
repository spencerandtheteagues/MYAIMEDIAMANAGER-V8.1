import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share2, Clock, Calendar, CheckCircle, XCircle, Edit, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Post } from "@shared/schema";

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  onApprove?: (postId: string) => void;
  onReject?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPreview?: (postId: string) => void;
  compact?: boolean;
}

export default function PostCard({
  post,
  showActions = false,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onPreview,
  compact = false,
}: PostCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformMap: Record<string, string> = {
      "Instagram": "fab fa-instagram text-pink-500",
      "Facebook": "fab fa-facebook text-blue-600",
      "X (Twitter)": "fab fa-twitter text-blue-400",
      "LinkedIn": "fab fa-linkedin text-blue-700",
      "TikTok": "fab fa-tiktok text-gray-800 dark:text-gray-200",
    };
    return platformMap[platform] || "fas fa-globe text-gray-500";
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${compact ? '' : ''}`}>
      {/* Image Display */}
      {post.imageUrl && (
        <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <img
            src={post.imageUrl}
            alt="Post media"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/1080x1080/9333ea/ffffff?text=${encodeURIComponent(post.platforms[0] || 'Social Media Post')}`;
            }}
          />
          {post.videoUrl && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs">
              <i className="fas fa-play" />
              Video
            </div>
          )}
          {post.aiGenerated && (
            <div className="absolute top-2 left-2 bg-purple-600/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <i className="fas fa-robot" />
              AI Generated
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Status Badge */}
            <Badge className={`${getStatusColor(post.status)} mb-2`}>
              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </Badge>
            
            {/* Platforms */}
            <div className="flex items-center gap-2 mb-2">
              {post.platforms.map((platform) => (
                <div key={platform} className="flex items-center gap-1">
                  <i className={getPlatformIcon(platform)} />
                  {!compact && <span className="text-xs text-muted-foreground">{platform}</span>}
                </div>
              ))}
            </div>

            {/* Schedule Info */}
            {post.scheduledFor && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Calendar className="w-3 h-3" />
                Scheduled for {new Date(post.scheduledFor).toLocaleDateString()}
              </div>
            )}

            {/* Published Info */}
            {post.publishedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <CheckCircle className="w-3 h-3" />
                Published {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Content Preview */}
        <p className={`text-sm text-foreground ${compact ? 'line-clamp-2' : 'line-clamp-3'} mb-4`}>
          {post.content}
        </p>

        {/* Engagement Metrics */}
        {post.engagementData && (
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span>{post.engagementData.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>{post.engagementData.comments}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="w-4 h-4 text-green-500" />
              <span>{post.engagementData.shares}</span>
            </div>
            {post.engagementData.reach && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-purple-500" />
                <span>{post.engagementData.reach}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            {post.status === "pending" && (
              <>
                {onApprove && (
                  <Button
                    onClick={() => onApprove(post.id)}
                    size="sm"
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                )}
                {onReject && (
                  <Button
                    onClick={() => onReject(post.id)}
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                )}
              </>
            )}
            
            {onEdit && (
              <Button
                onClick={() => onEdit(post.id)}
                size="sm"
                variant="outline"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            
            {onPreview && (
              <Button
                onClick={() => onPreview(post.id)}
                size="sm"
                variant="outline"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                onClick={() => onDelete(post.id)}
                size="sm"
                variant="ghost"
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}