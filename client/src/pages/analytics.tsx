import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, Users, MousePointer, TrendingUp, TrendingDown } from "lucide-react";

interface AnalyticsData {
  metrics: {
    totalReach: number;
    engagement: number;
    newFollowers: number;
    clickRate: number;
  };
  platformPerformance: Array<{
    platform: string;
    followers: number;
    engagement: number;
    change: number;
  }>;
  engagementOverTime: Array<{
    date: string;
    value: number;
  }>;
  topPerformingPosts: Array<{
    id: string;
    platform: string;
    content: string;
    publishedAt: string;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
    engagementRate: number;
  }>;
}

export default function Analytics() {
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const chartData = analyticsData?.engagementOverTime || [];
  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="p-6 space-y-8">
      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Analytics</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track your social media performance across all platforms
              </p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="text-blue-600 dark:text-blue-400 w-8 h-8" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {analyticsData?.metrics.totalReach.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-muted-foreground">Total Reach</p>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">+18% from last period</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="text-green-600 dark:text-green-400 w-8 h-8" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {analyticsData?.metrics.engagement.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-muted-foreground">Engagement</p>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">+23% from last period</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="text-purple-600 dark:text-purple-400 w-8 h-8" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {analyticsData?.metrics.newFollowers.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-muted-foreground">New Followers</p>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">+12% from last period</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <MousePointer className="text-amber-600 dark:text-amber-400 w-8 h-8" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {analyticsData?.metrics.clickRate}%
              </p>
              <p className="text-sm text-muted-foreground">Click Rate</p>
              <div className="flex items-center justify-center mt-1">
                <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                <span className="text-xs text-red-600">-2% from last period</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Chart & Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((data, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div
                    className="bg-primary w-8 chart-bar transition-all duration-300 hover:opacity-80"
                    style={{ height: `${(data.value / maxValue) * 200}px` }}
                  />
                  <span className="text-xs text-muted-foreground">{data.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData?.platformPerformance.map((platform) => (
              <div
                key={platform.platform}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <i className={`fab fa-${platform.platform.toLowerCase().replace(' (twitter)', '').replace('x (twitter)', 'twitter')} text-xl ${
                    platform.platform === "Instagram" ? "text-pink-500" :
                    platform.platform === "Facebook" ? "text-blue-600" :
                    platform.platform.includes("Twitter") ? "text-blue-400" :
                    platform.platform === "LinkedIn" ? "text-blue-700" : "text-gray-500"
                  }`} />
                  <div>
                    <p className="font-medium text-foreground">{platform.platform}</p>
                    <p className="text-sm text-muted-foreground">
                      {platform.followers.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">
                    {platform.engagement.toLocaleString()}
                  </p>
                  <div className="flex items-center">
                    {platform.change > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${platform.change > 0 ? "text-green-600" : "text-red-600"}`}>
                      {platform.change > 0 ? "+" : ""}{platform.change}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analyticsData?.topPerformingPosts.map((post) => (
            <div key={post.id} className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
              <div className="flex-shrink-0">
                <i className={`fab fa-${post.platform.toLowerCase().replace(' (twitter)', '').replace('x (twitter)', 'twitter')} text-xl ${
                  post.platform === "Instagram" ? "text-pink-500" :
                  post.platform === "Facebook" ? "text-blue-600" :
                  post.platform.includes("Twitter") ? "text-blue-400" :
                  post.platform === "LinkedIn" ? "text-blue-700" : "text-gray-500"
                }`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{post.content}</p>
                <p className="text-sm text-muted-foreground mt-1">Posted {post.publishedAt}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  <span>
                    <Heart className="w-3 h-3 inline mr-1" />
                    {post.engagement.likes} likes
                  </span>
                  <span>
                    <i className="fas fa-comment w-3 h-3 inline mr-1" />
                    {post.engagement.comments} comments
                  </span>
                  <span>
                    <i className="fas fa-share w-3 h-3 inline mr-1" />
                    {post.engagement.shares} shares
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">{post.engagementRate}%</p>
                <p className="text-xs text-muted-foreground">Engagement</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
