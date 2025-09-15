import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Video, Calendar, Users } from "lucide-react";
import type { Post } from "@shared/schema";

interface PostPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  post: Post;
}

export default function PostPreviewDialog({ open, onClose, post }: PostPreviewDialogProps) {
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Preview */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Publishing to:</span>
            <div className="flex gap-2">
              {post.platforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="gap-1">
                  <i className={getPlatformIcon(platform)} />
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          {/* Content Preview Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Media Preview */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="relative bg-gray-100 aspect-square flex items-center justify-center">
                  {post.mediaUrls[0].includes('video') ? (
                    <div className="text-center p-8">
                      <Video className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-muted-foreground">Video Content</p>
                      <a 
                        href={post.mediaUrls[0]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-2 inline-block"
                      >
                        Open video in new tab
                      </a>
                    </div>
                  ) : (
                    <img 
                      src={post.mediaUrls[0]} 
                      alt="Post media" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af"%3EImage Preview%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  )}
                </div>
              )}

              {/* Post Content */}
              <div className="p-4">
                <p className="whitespace-pre-wrap text-sm">{post.content}</p>
              </div>

              {/* Post Metadata */}
              <div className="border-t px-4 py-3 bg-muted/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {post.scheduledFor && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.scheduledFor).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {post.platforms.length} platform{post.platforms.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {post.aiGenerated && (
                    <Badge variant="outline" className="text-xs">
                      AI Generated
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Status: </span>
              <Badge variant={post.status === 'approved' ? 'default' : post.status === 'rejected' ? 'destructive' : 'secondary'}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </Badge>
            </div>
            {post.rejectionReason && (
              <p className="text-sm text-destructive">
                Rejection reason: {post.rejectionReason}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={onClose} data-testid="button-close-preview">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}