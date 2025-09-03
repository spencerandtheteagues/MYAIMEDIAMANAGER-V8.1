import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Send, Users, UserCheck, CreditCard, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if current user is admin
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Get all users for user selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: currentUser?.role === "admin",
  });

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    userId: "" as string,
    title: "",
    message: "",
    type: "admin_message" as string,
    actionUrl: "",
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: typeof notificationForm) => {
      return await apiRequest("POST", "/api/notifications", {
        userId: data.userId || undefined,
        title: data.title,
        message: data.message,
        type: data.type,
        actionUrl: data.actionUrl || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification Sent",
        description: notificationForm.userId ? "Notification sent to user" : "Global notification sent to all users",
      });
      // Reset form
      setNotificationForm({
        userId: "",
        title: "",
        message: "",
        type: "admin_message",
        actionUrl: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Admin privileges required to access this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users and send system notifications</p>
      </div>

      {/* Admin Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.isPaid).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "admin").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => {
                const lastActive = new Date(u.updatedAt || u.createdAt);
                const today = new Date();
                return lastActive.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Notification
          </CardTitle>
          <CardDescription>
            Send notifications to specific users or broadcast to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-user">Target User</Label>
            <Select
              value={notificationForm.userId}
              onValueChange={(value) => setNotificationForm({ ...notificationForm, userId: value })}
            >
              <SelectTrigger id="notification-user" data-testid="select-notification-user">
                <SelectValue placeholder="Select user (leave empty for all users)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" data-testid="option-all-users">All Users (Global Notification)</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id} data-testid={`option-user-${user.id}`}>
                    {user.fullName || user.username} ({user.email || user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-type">Notification Type</Label>
            <Select
              value={notificationForm.type}
              onValueChange={(value) => setNotificationForm({ ...notificationForm, type: value })}
            >
              <SelectTrigger id="notification-type" data-testid="select-notification-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system" data-testid="option-type-system">System</SelectItem>
                <SelectItem value="admin_message" data-testid="option-type-admin">Admin Message</SelectItem>
                <SelectItem value="new_feature" data-testid="option-type-feature">New Feature</SelectItem>
                <SelectItem value="credit_low" data-testid="option-type-credit">Credit Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-title">Title</Label>
            <Input
              id="notification-title"
              placeholder="Enter notification title"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
              data-testid="input-notification-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-message">Message</Label>
            <Textarea
              id="notification-message"
              placeholder="Enter notification message"
              value={notificationForm.message}
              onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
              rows={4}
              data-testid="textarea-notification-message"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-url">Action URL (Optional)</Label>
            <Input
              id="notification-url"
              placeholder="e.g., /campaigns or /settings"
              value={notificationForm.actionUrl}
              onChange={(e) => setNotificationForm({ ...notificationForm, actionUrl: e.target.value })}
              data-testid="input-notification-url"
            />
          </div>

          <Button
            onClick={() => sendNotificationMutation.mutate(notificationForm)}
            disabled={!notificationForm.title || !notificationForm.message || sendNotificationMutation.isPending}
            className="w-full"
            data-testid="button-send-notification"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendNotificationMutation.isPending ? "Sending..." : 
             notificationForm.userId ? "Send to User" : "Send to All Users"}
          </Button>
        </CardContent>
      </Card>

      {/* Users Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Tier</th>
                  <th className="text-left p-2">Credits</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b" data-testid={`user-row-${user.id}`}>
                    <td className="p-2">
                      <div className="font-medium">{user.fullName || user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.businessName}</div>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {user.email || user.username}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === "admin" 
                          ? "bg-purple-500/20 text-purple-500" 
                          : "bg-gray-500/20 text-gray-500"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">
                        {user.tier}
                      </span>
                    </td>
                    <td className="p-2">{user.credits.toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isPaid 
                          ? "bg-green-500/20 text-green-500" 
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}>
                        {user.isPaid ? "Paid" : "Free"}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}