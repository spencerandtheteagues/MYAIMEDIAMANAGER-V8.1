import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { Post } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch all posts (scheduled, published, draft)
  const { data: allPosts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  // Filter posts for current month
  const postsThisMonth = allPosts.filter(post => {
    const postDate = post.scheduledFor ? new Date(post.scheduledFor) : 
                     post.publishedAt ? new Date(post.publishedAt) : null;
    if (!postDate) return false;
    return postDate.getMonth() === currentDate.getMonth() && 
           postDate.getFullYear() === currentDate.getFullYear();
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Post deleted",
        description: "The post has been removed from the calendar",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the post",
        variant: "destructive",
      });
    },
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getPostsForDay = (day: number) => {
    return postsThisMonth.filter(post => {
      const postDate = post.scheduledFor ? new Date(post.scheduledFor) : 
                       post.publishedAt ? new Date(post.publishedAt) : null;
      if (!postDate) return false;
      return postDate.getDate() === day;
    }).sort((a, b) => {
      const aDate = new Date(a.scheduledFor || a.publishedAt || 0);
      const bDate = new Date(b.scheduledFor || b.publishedAt || 0);
      return aDate.getTime() - bDate.getTime();
    });
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setShowDayDialog(true);
  };

  const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay) : [];
  const selectedDate = selectedDay 
    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay)
    : null;

  const getPlatformColor = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase().replace(/[^a-z]/g, '');
    const colors: Record<string, string> = {
      instagram: "bg-pink-500",
      facebook: "bg-blue-500",
      x: "bg-gray-700",
      xtwitter: "bg-gray-700",
      twitter: "bg-sky-500",
      tiktok: "bg-purple-600",
      linkedin: "bg-blue-700",
    };
    return colors[normalizedPlatform] || "bg-gray-500";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      scheduled: { variant: "default", label: "Scheduled" },
      published: { variant: "success", label: "Published" },
      approved: { variant: "success", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      pending: { variant: "warning", label: "Pending" },
    };
    return statusConfig[status] || { variant: "secondary", label: status };
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Content Calendar</h1>
        <p className="text-gray-400 mt-2">View and manage all your scheduled content - click any day to see details</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
                data-testid="button-today"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                onClick={() => setLocation('/create')}
                className="ml-4"
                data-testid="button-create-post"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium bg-muted text-muted-foreground border-b border-r border-border last:border-r-0"
              >
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {getDaysInMonth(currentDate).map((day, index) => {
              const posts = day ? getPostsForDay(day) : [];
              const isToday = day === new Date().getDate() && 
                            currentDate.getMonth() === new Date().getMonth() &&
                            currentDate.getFullYear() === new Date().getFullYear();
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[100px] p-2 border-b border-r border-border last:border-r-0
                    ${day ? 'cursor-pointer hover:bg-muted/50 transition-colors' : 'bg-muted/20'}
                    ${isToday ? 'bg-primary/10' : ''}
                  `}
                  onClick={() => day && handleDayClick(day)}
                  data-testid={day ? `day-${day}` : `empty-${index}`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                          {day}
                        </span>
                        {posts.length > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {posts.length}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Show up to 3 post indicators */}
                      <div className="space-y-1">
                        {posts.slice(0, 3).map((post, i) => {
                          const platforms = Array.isArray(post.platforms) ? post.platforms : [post.platform];
                          return (
                            <div
                              key={post.id}
                              className="flex items-center space-x-1"
                              data-testid={`post-indicator-${post.id}`}
                            >
                              {platforms.map((platform, idx) => (
                                <div 
                                  key={idx} 
                                  className={`w-2 h-2 rounded-full ${getPlatformColor(platform)}`} 
                                />
                              ))}
                              <span className="text-xs text-muted-foreground truncate">
                                {(post.scheduledFor || post.publishedAt) && format(new Date(post.scheduledFor || post.publishedAt), 'HH:mm')}
                              </span>
                            </div>
                          );
                        })}
                        {posts.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{posts.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>
                {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </span>
              {selectedDayPosts.length > 0 && (
                <Badge variant="secondary">
                  {selectedDayPosts.length} {selectedDayPosts.length === 1 ? 'post' : 'posts'}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              View and manage posts scheduled for this day
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            {selectedDayPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No posts scheduled for this day</p>
                <Button 
                  onClick={() => {
                    setShowDayDialog(false);
                    setLocation('/create');
                  }}
                  data-testid="button-schedule-post"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule a Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayPosts.map((post) => {
                  const statusConfig = getStatusBadge(post.status);
                  const postTime = post.scheduledFor 
                    ? format(new Date(post.scheduledFor), 'h:mm a')
                    : post.publishedAt 
                    ? format(new Date(post.publishedAt), 'h:mm a')
                    : '';
                  const platforms = Array.isArray(post.platforms) ? post.platforms : [post.platform];
                  
                  return (
                    <Card key={post.id} className="overflow-hidden" data-testid={`post-card-${post.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          {/* Media Preview */}
                          {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {post.mediaUrls[0].includes('.mp4') || post.mediaUrls[0].includes('.webm') ? (
                                <video 
                                  src={post.mediaUrls[0]} 
                                  className="w-full h-full object-cover"
                                  muted
                                />
                              ) : (
                                <img 
                                  src={post.mediaUrls[0]} 
                                  alt="Post media"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}
                          
                          {/* Post Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {platforms.map((platform, idx) => (
                                  <div key={idx} className="flex items-center space-x-1">
                                    <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform)}`} />
                                    <span className="text-sm font-medium capitalize">
                                      {platform}
                                    </span>
                                  </div>
                                ))}
                                <Badge variant={statusConfig.variant as any}>
                                  {statusConfig.label}
                                </Badge>
                                {postTime && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {postTime}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setLocation(`/create?edit=${post.id}`)}
                                  data-testid={`button-edit-${post.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deletePostMutation.mutate(post.id)}
                                  data-testid={`button-delete-${post.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Content Preview */}
                            {post.content && (
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                                {post.content}
                              </p>
                            )}
                            
                            {/* Tags */}
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {post.hashtags.slice(0, 5).map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                                {post.hashtags.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{post.hashtags.length - 5}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}