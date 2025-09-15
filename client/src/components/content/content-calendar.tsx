import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Post } from "@shared/schema";

interface ContentCalendarProps {
  posts: Post[];
  onDateSelect?: (date: Date) => void;
  onPostClick?: (post: Post) => void;
  onCreatePost?: () => void;
}

export default function ContentCalendar({ 
  posts, 
  onDateSelect, 
  onPostClick, 
  onCreatePost 
}: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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
    return posts.filter(post => {
      const postDate = new Date(post.scheduledFor || post.publishedAt!);
      return postDate.getDate() === day &&
             postDate.getMonth() === currentDate.getMonth() &&
             postDate.getFullYear() === currentDate.getFullYear();
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

  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Content Calendar</CardTitle>
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
            {onCreatePost && (
              <Button onClick={onCreatePost}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Post
              </Button>
            )}
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
              className={`bg-card p-2 h-24 text-sm relative cursor-pointer hover:bg-muted/50 transition-colors ${
                day && isToday(day) ? "bg-blue-50 dark:bg-blue-950" : ""
              }`}
              onClick={() => day && onDateSelect && onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
            >
              {day && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium text-xs ${
                      isToday(day) ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                    }`}>
                      {day}
                    </span>
                    {isToday(day) && (
                      <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-blue-100 text-blue-600 border-blue-200">
                        Today
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {getPostsForDay(day).slice(0, 2).map((post) => (
                      <div
                        key={post.id}
                        className="text-xs p-1 bg-primary/10 rounded border-l-2 border-primary cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPostClick && onPostClick(post);
                        }}
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          {post.platforms.slice(0, 3).map((platform) => (
                            <div
                              key={platform}
                              className={`w-2 h-2 rounded-full ${getPlatformColor(platform)}`}
                            />
                          ))}
                          {post.scheduledFor && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.scheduledFor).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-foreground/80">
                          {post.content.slice(0, 40)}...
                        </p>
                      </div>
                    ))}
                    
                    {getPostsForDay(day).length > 2 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{getPostsForDay(day).length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
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
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-800 rounded-full" />
            <span className="text-muted-foreground">TikTok</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
