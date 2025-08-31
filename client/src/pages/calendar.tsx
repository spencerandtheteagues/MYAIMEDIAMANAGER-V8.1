import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react";
import type { Post } from "@shared/schema";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: scheduledPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts", "scheduled"],
  });

  const { data: publishedPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts", "published"],
  });

  // Combine and filter posts for current month
  const allPosts = [...(scheduledPosts || []), ...(publishedPosts || [])];
  const postsThisMonth = allPosts.filter(post => {
    const postDate = new Date(post.scheduledFor || post.publishedAt!);
    return postDate.getMonth() === currentDate.getMonth() && 
           postDate.getFullYear() === currentDate.getFullYear();
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
      const postDate = new Date(post.scheduledFor || post.publishedAt!);
      return postDate.getDate() === day;
    });
  };

  const getPlatformColor = (platform: string) => {
    const colorMap: { [key: string]: string } = {
      "Instagram": "bg-pink-500",
      "Facebook": "bg-blue-600",
      "X (Twitter)": "bg-blue-400",
      "TikTok": "bg-gray-800",
      "LinkedIn": "bg-blue-700",
    };
    return colorMap[platform] || "bg-gray-500";
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  const upcomingPosts = allPosts
    .filter(post => post.scheduledFor && new Date(post.scheduledFor) > new Date())
    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
    .slice(0, 3);

  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Calendar</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your scheduled posts
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium text-foreground min-w-[120px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Post
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {/* Calendar header */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-muted p-3 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => (
              <div
                key={index}
                className={`bg-card p-3 h-24 text-sm relative ${
                  day && isToday(day) ? "bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                {day && (
                  <>
                    <span className={`font-medium ${
                      isToday(day) ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                    }`}>
                      {day}
                    </span>
                    {isToday(day) && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Today</div>
                    )}
                    <div className="mt-1 space-y-1">
                      {getPostsForDay(day).slice(0, 3).map((post) => (
                        <div key={post.id} className="flex space-x-1">
                          {post.platforms.map((platform) => (
                            <div
                              key={platform}
                              className={`w-2 h-2 rounded-full ${getPlatformColor(platform)}`}
                            />
                          ))}
                        </div>
                      ))}
                      {getPostsForDay(day).length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{getPostsForDay(day).length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="text-muted-foreground">Facebook</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full" />
              <span className="text-muted-foreground">Instagram</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
              <span className="text-muted-foreground">X (Twitter)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-700 rounded-full" />
              <span className="text-muted-foreground">LinkedIn</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming scheduled posts
            </div>
          ) : (
            upcomingPosts.map((post) => (
              <div key={post.id} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <div className="flex-shrink-0">
                  <i className={`fab fa-${post.platforms[0].toLowerCase().replace(' (twitter)', '').replace('x (twitter)', 'twitter')} text-xl ${
                    post.platforms[0] === "Instagram" ? "text-pink-500" :
                    post.platforms[0] === "Facebook" ? "text-blue-600" :
                    post.platforms[0].includes("Twitter") ? "text-blue-400" :
                    post.platforms[0] === "LinkedIn" ? "text-blue-700" : "text-gray-500"
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {post.scheduledFor && new Date(post.scheduledFor).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {post.content.slice(0, 80)}...
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
