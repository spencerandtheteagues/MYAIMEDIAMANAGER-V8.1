import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share2, Bookmark, Send, ThumbsUp, Repeat, MoreHorizontal } from "lucide-react";

interface PlatformPreviewProps {
  platform: string;
  content: string;
  businessName?: string;
  imageUrl?: string;
}

export default function PlatformPreview({ platform, content, businessName = "Your Business", imageUrl }: PlatformPreviewProps) {
  const getCharacterLimit = (platform: string) => {
    switch (platform) {
      case "X (Twitter)":
        return 280;
      case "Instagram":
        return 2200;
      case "Facebook":
        return 63206;
      case "LinkedIn":
        return 3000;
      case "TikTok":
        return 2200;
      default:
        return 2200;
    }
  };

  const characterLimit = getCharacterLimit(platform);
  const isOverLimit = content.length > characterLimit;

  if (platform === "Instagram") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{businessName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{businessName.toLowerCase().replace(/\s+/g, '_')}</p>
                <p className="text-xs text-muted-foreground">Sponsored</p>
              </div>
            </div>
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 relative">
          {imageUrl ? (
            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Image Preview</p>
            </div>
          )}
        </div>
        <CardContent className="pt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Heart className="h-6 w-6" />
              <MessageSquare className="h-6 w-6" />
              <Send className="h-6 w-6" />
            </div>
            <Bookmark className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold mb-1">1,234 likes</p>
          <p className="text-sm">
            <span className="font-semibold">{businessName.toLowerCase().replace(/\s+/g, '_')}</span>{' '}
            {content || "Your Instagram content will appear here..."}
          </p>
          {isOverLimit && (
            <Badge variant="destructive" className="mt-2">
              {content.length}/{characterLimit} characters
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  if (platform === "Facebook") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{businessName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{businessName}</p>
              <p className="text-xs text-muted-foreground">Sponsored · Just now · 🌐</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm mb-3">{content || "Your Facebook content will appear here..."}</p>
          {imageUrl && (
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg mb-3">
              <img src={imageUrl} alt="Post" className="w-full h-full object-cover rounded-lg" />
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-t border-b">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <ThumbsUp className="w-3 h-3 text-white" />
                </div>
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground ml-1">324</span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>45 comments</span>
              <span>12 shares</span>
            </div>
          </div>
          <div className="flex items-center justify-around pt-2">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted px-4 py-2 rounded">
              <ThumbsUp className="h-4 w-4" />
              Like
            </button>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted px-4 py-2 rounded">
              <MessageSquare className="h-4 w-4" />
              Comment
            </button>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted px-4 py-2 rounded">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
          {isOverLimit && (
            <Badge variant="destructive" className="mt-2">
              {content.length}/{characterLimit} characters
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  if (platform === "X (Twitter)") {
    return (
      <Card className="overflow-hidden">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{businessName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold">{businessName}</p>
                <Badge variant="secondary" className="text-xs px-1">Ad</Badge>
                <p className="text-sm text-muted-foreground">@{businessName.toLowerCase().replace(/\s+/g, '')} · now</p>
              </div>
              <p className="text-sm mt-1">{content || "Your tweet will appear here..."}</p>
              {imageUrl && (
                <div className="mt-3 aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden">
                  <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <button className="flex items-center gap-1 text-muted-foreground hover:text-blue-500">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">12</span>
                </button>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-green-500">
                  <Repeat className="h-4 w-4" />
                  <span className="text-xs">34</span>
                </button>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500">
                  <Heart className="h-4 w-4" />
                  <span className="text-xs">156</span>
                </button>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-blue-500">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              {isOverLimit && (
                <Badge variant="destructive" className="mt-2">
                  {content.length}/{characterLimit} characters
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (platform === "LinkedIn") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{businessName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{businessName}</p>
                <p className="text-xs text-muted-foreground">10,234 followers</p>
                <p className="text-xs text-muted-foreground">Promoted · 1h · 🌐</p>
              </div>
            </div>
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm whitespace-pre-wrap">{content || "Your LinkedIn content will appear here..."}</p>
          {imageUrl && (
            <div className="mt-3 aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg overflow-hidden">
              <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <div className="w-4 h-4 rounded-full bg-green-500" />
            </div>
            <span>234 reactions · 45 comments · 12 reposts</span>
          </div>
          <div className="flex items-center justify-around mt-3 pt-3 border-t">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted px-3 py-2 rounded">
              <ThumbsUp className="h-4 w-4" />
              Like
            </button>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted px-3 py-2 rounded">
              <MessageSquare className="h-4 w-4" />
              Comment
            </button>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted px-3 py-2 rounded">
              <Repeat className="h-4 w-4" />
              Repost
            </button>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted px-3 py-2 rounded">
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
          {isOverLimit && (
            <Badge variant="destructive" className="mt-2">
              {content.length}/{characterLimit} characters
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  if (platform === "TikTok") {
    return (
      <Card className="overflow-hidden bg-black text-white">
        <div className="aspect-[9/16] relative bg-gradient-to-br from-pink-500 to-purple-500">
          {imageUrl ? (
            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/70">Video Preview</p>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8 ring-2 ring-white">
                <AvatarFallback>{businessName[0]}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold">@{businessName.toLowerCase().replace(/\s+/g, '')}</p>
              <Badge variant="secondary" className="text-xs">Sponsored</Badge>
            </div>
            <p className="text-sm">{content || "Your TikTok caption will appear here..."}</p>
            <p className="text-xs mt-2 text-white/70">🎵 Original Sound - {businessName}</p>
          </div>
          <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4">
            <button className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">32.4K</span>
            </button>
            <button className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">892</span>
            </button>
            <button className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Share2 className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Share</span>
            </button>
          </div>
        </div>
        {isOverLimit && (
          <div className="p-2">
            <Badge variant="destructive">
              {content.length}/{characterLimit} characters
            </Badge>
          </div>
        )}
      </Card>
    );
  }

  // Default preview
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{platform} Preview</h3>
          {isOverLimit && (
            <Badge variant="destructive">
              {content.length}/{characterLimit} characters
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{content || `Your ${platform} content will appear here...`}</p>
      </CardContent>
    </Card>
  );
}