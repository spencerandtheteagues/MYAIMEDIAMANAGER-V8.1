import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { Calendar, momentLocalizer, View, SlotInfo } from "react-big-calendar";
import moment from "moment";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Image, 
  FileText, 
  Video,
  GripVertical,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Send,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from "lucide-react";
import type { Post } from "@shared/schema";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    post: Post;
    type: "scheduled" | "draft" | "published";
  };
}

interface DraggablePostProps {
  post: Post;
  isDragging?: boolean;
}

const platformIcons: Record<string, any> = {
  Instagram,
  Facebook,
  "X": Twitter,
  LinkedIn: Linkedin,
  TikTok: Video
};

function DraggablePost({ post, isDragging }: DraggablePostProps) {
  const platforms = post.platforms || [];
  
  return (
    <div className={`border rounded-lg p-3 bg-background ${isDragging ? 'opacity-50' : ''} cursor-move`}>
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-1" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2">{post.content}</p>
          <div className="flex items-center gap-2 mt-2">
            {post.imageUrl && <Image className="w-4 h-4 text-muted-foreground" />}
            {post.videoUrl && <Video className="w-4 h-4 text-muted-foreground" />}
            <div className="flex gap-1">
              {platforms.map((platform: string) => {
                const Icon = platformIcons[platform] || FileText;
                return <Icon key={platform} className="w-3 h-3 text-muted-foreground" />;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarEventComponent({ event }: { event: CalendarEvent }) {
  const { post, type } = event.resource;
  const platforms = post.platforms || [];
  
  const getBgColor = () => {
    switch (type) {
      case "published": return "bg-green-100 dark:bg-green-900/20 border-green-500";
      case "scheduled": return "bg-blue-100 dark:bg-blue-900/20 border-blue-500";
      default: return "bg-gray-100 dark:bg-gray-900/20 border-gray-500";
    }
  };
  
  return (
    <div className={`p-2 rounded border ${getBgColor()} h-full overflow-hidden`}>
      <div className="text-xs font-medium line-clamp-2 mb-1">
        {post.content}
      </div>
      <div className="flex items-center gap-1">
        {platforms.map((platform: string) => {
          const Icon = platformIcons[platform] || FileText;
          return <Icon key={platform} className="w-3 h-3" />;
        })}
        {post.imageUrl && <Image className="w-3 h-3" />}
        {post.videoUrl && <Video className="w-3 h-3" />}
      </div>
    </div>
  );
}

export default function Schedule() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: draftPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts/draft"],
  });

  const reschedulePostMutation = useMutation({
    mutationFn: async ({ postId, scheduledFor }: { postId: string; scheduledFor: Date }) => {
      const response = await apiRequest("PATCH", `/api/posts/${postId}`, {
        scheduledFor: scheduledFor.toISOString(),
        status: "scheduled"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/draft"] });
      toast({
        title: "Post rescheduled",
        description: "The post has been moved to the new time slot.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reschedule post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, updates }: { postId: string; updates: Partial<Post> }) => {
      const response = await apiRequest("PATCH", `/api/posts/${postId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Post updated",
        description: "Your changes have been saved.",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("DELETE", `/api/posts/${postId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Post deleted",
        description: "The post has been removed from your schedule.",
      });
    },
  });

  const publishPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/publish`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post published",
        description: "Your post has been published successfully.",
      });
    },
  });

  // Convert posts to calendar events
  const events: CalendarEvent[] = (posts || [])
    .filter(post => post.scheduledFor || post.publishedAt)
    .map(post => {
      const startDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.scheduledFor!);
      const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 minutes duration
      
      return {
        id: post.id,
        title: post.content.substring(0, 50),
        start: startDate,
        end: endDate,
        resource: {
          post,
          type: post.status === "published" ? "published" : 
                post.status === "scheduled" ? "scheduled" : "draft"
        }
      };
    });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Handle drop on calendar slot
      if (over.data?.current?.date) {
        const postId = active.id as string;
        const newDate = over.data.current.date as Date;
        
        reschedulePostMutation.mutate({
          postId,
          scheduledFor: newDate
        });
      }
    }
    
    setActiveId(null);
  };

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setIsCreateDialogOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedPost(event.resource.post);
    setIsEditDialogOpen(true);
  }, []);

  const handleEventDrop = ({ event, start, end }: any) => {
    reschedulePostMutation.mutate({
      postId: event.id,
      scheduledFor: start
    });
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3174ad";
    let borderColor = "#265985";
    
    switch (event.resource.type) {
      case "published":
        backgroundColor = "#10b981";
        borderColor = "#059669";
        break;
      case "scheduled":
        backgroundColor = "#3b82f6";
        borderColor = "#2563eb";
        break;
      default:
        backgroundColor = "#6b7280";
        borderColor = "#4b5563";
    }
    
    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: `1px solid ${borderColor}`,
        display: "block"
      }
    };
  };

  const activePost = activeId ? 
    [...(posts || []), ...(draftPosts || [])].find(p => p.id === activeId) : 
    null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Content Schedule</h1>
            <p className="text-muted-foreground mt-2">
              Drag and drop to reschedule your posts
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={view} onValueChange={(v) => setView(v as View)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Draft Posts Sidebar */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Draft Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {!draftPosts || draftPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No draft posts available
                  </p>
                ) : (
                  draftPosts.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        setActiveId(post.id);
                      }}
                      onDragEnd={() => setActiveId(null)}
                    >
                      <DraggablePost post={post} isDragging={activeId === post.id} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <div className="col-span-9">
            <Card>
              <CardContent className="p-4">
                <div style={{ height: 600 }}>
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    view={view}
                    date={date}
                    onNavigate={setDate}
                    onView={setView}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    onEventDrop={handleEventDrop}
                    selectable
                    resizable
                    eventPropGetter={eventStyleGetter}
                    components={{
                      event: CalendarEventComponent
                    }}
                    className="rbc-calendar-custom"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="flex items-center gap-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-sm">Published</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-sm">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded" />
              <span className="text-sm">Draft</span>
            </div>
          </CardContent>
        </Card>

        {/* Edit Post Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Scheduled Post</DialogTitle>
              <DialogDescription>
                Modify the post details or reschedule it
              </DialogDescription>
            </DialogHeader>
            
            {selectedPost && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedPost.content}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Platforms</label>
                  <div className="flex gap-2 mt-2">
                    {selectedPost.platforms?.map((platform) => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {selectedPost.scheduledFor && (
                  <div>
                    <label className="text-sm font-medium">Scheduled For</label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {moment(selectedPost.scheduledFor).format("MMMM Do YYYY, h:mm a")}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => deletePostMutation.mutate(selectedPost.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  
                  <div className="flex gap-2">
                    {selectedPost.status === "scheduled" && (
                      <Button
                        variant="default"
                        onClick={() => publishPostMutation.mutate(selectedPost.id)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Publish Now
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Drag Overlay */}
        <DragOverlay>
          {activePost && <DraggablePost post={activePost} isDragging />}
        </DragOverlay>
      </div>
    </DndContext>
  );
}