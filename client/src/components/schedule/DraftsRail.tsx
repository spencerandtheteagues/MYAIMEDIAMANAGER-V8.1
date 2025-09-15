import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GripVertical, Image, Video, FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface Draft {
  id: string;
  title?: string;
  content?: string;
  caption?: string;
  platform: string;
  mediaUrls?: string[];
  hasImage?: boolean;
  hasVideo?: boolean;
  tags?: string[];
  createdAt: string;
}

export function DraftsRail() {
  const { data: drafts = [], isLoading } = useQuery<Draft[]>({
    queryKey: ["/api/posts/draft"],
    queryFn: async () => {
      const response = await fetch("/api/posts/draft");
      if (!response.ok) throw new Error("Failed to fetch drafts");
      const data = await response.json();
      return data.items || data || [];
    }
  });

  const getPreviewText = (draft: Draft) => {
    return draft.title || draft.caption || draft.content || "Untitled Draft";
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      facebook: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      x: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      twitter: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      tiktok: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      linkedin: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    };
    return colors[platform.toLowerCase()] || "bg-zinc-700/10 text-zinc-400 border-zinc-700/20";
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">Draft Posts</h3>
        <Button size="sm" variant="ghost" className="h-7 px-2">
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1" id="drafts-container">
        <div className="space-y-2 pr-4">
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </>
          )}

          {!isLoading && drafts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-zinc-500 mb-3">No drafts available</p>
              <Button size="sm" variant="outline" className="text-xs">
                Create Content
              </Button>
            </div>
          )}

          {!isLoading && drafts.map((draft) => (
            <div
              key={draft.id}
              className="draft-card cursor-grab active:cursor-grabbing rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 p-3 transition-all hover:shadow-lg hover:border-zinc-700"
              data-event={JSON.stringify({
                id: draft.id,
                title: getPreviewText(draft),
                platform: draft.platform,
                caption: draft.caption || draft.content,
                mediaUrls: draft.mediaUrls || [],
                tags: draft.tags || []
              })}
              draggable="true"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-200 line-clamp-2 mb-2">
                    {getPreviewText(draft)}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 ${getPlatformColor(draft.platform)}`}
                    >
                      {draft.platform.toUpperCase()}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      {(draft.hasImage || draft.mediaUrls?.some(url => url.match(/\.(jpg|jpeg|png|gif|webp)/i))) && (
                        <Image className="w-3 h-3 text-zinc-500" />
                      )}
                      {(draft.hasVideo || draft.mediaUrls?.some(url => url.match(/\.(mp4|mov|avi|webm)/i))) && (
                        <Video className="w-3 h-3 text-zinc-500" />
                      )}
                      {!draft.hasImage && !draft.hasVideo && !draft.mediaUrls?.length && (
                        <FileText className="w-3 h-3 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {draft.tags && draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {draft.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[9px] text-zinc-600">
                          #{tag}
                        </span>
                      ))}
                      {draft.tags.length > 3 && (
                        <span className="text-[9px] text-zinc-600">
                          +{draft.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}