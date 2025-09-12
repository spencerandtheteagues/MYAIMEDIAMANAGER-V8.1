import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@shared/schema";

interface PostEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (postId: string, updates: Partial<Post>) => void;
  post: Post;
  isProcessing?: boolean;
}

const PLATFORMS = [
  "Instagram",
  "Facebook", 
  "X (Twitter)",
  "TikTok",
  "LinkedIn"
];

export default function PostEditDialog({ open, onClose, onSave, post, isProcessing }: PostEditDialogProps) {
  const [content, setContent] = useState(post.content);
  const [platforms, setPlatforms] = useState(post.platforms);

  const handlePlatformToggle = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const handleSave = () => {
    if (!content.trim() || platforms.length === 0) return;
    
    onSave(post.id, {
      content: content.trim(),
      platforms,
    });
  };

  const hasChanges = content !== post.content || 
    JSON.stringify(platforms.sort()) !== JSON.stringify(post.platforms.sort());

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Media Preview */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Attached Media:</p>
              <p className="text-sm text-muted-foreground">
                {post.mediaUrls[0].includes('video') ? '📹 Video' : '🖼️ Image'} attached
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Note: Media cannot be changed after generation
              </p>
            </div>
          )}

          {/* Content Editor */}
          <div className="space-y-2">
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Enter your post content..."
              className="resize-none"
              data-testid="textarea-post-content"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{content.length} characters</span>
              {content.length > 280 && (
                <span className="text-amber-600">
                  May be too long for X (Twitter)
                </span>
              )}
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Target Platforms</Label>
            <div className="space-y-3">
              {PLATFORMS.map(platform => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-${platform}`}
                    checked={platforms.includes(platform)}
                    onCheckedChange={() => handlePlatformToggle(platform)}
                    data-testid={`checkbox-edit-platform-${platform.toLowerCase()}`}
                  />
                  <Label 
                    htmlFor={`edit-${platform}`}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <i className={`fab fa-${platform.toLowerCase().replace(' (twitter)', '').replace('x ', 'twitter')}`} />
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
            {platforms.length === 0 && (
              <p className="text-sm text-destructive">Please select at least one platform</p>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            <Badge variant={post.status === 'approved' ? 'default' : post.status === 'rejected' ? 'destructive' : 'secondary'}>
              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isProcessing || !content.trim() || platforms.length === 0 || !hasChanges}
            data-testid="button-save-edit"
          >
            {isProcessing ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}