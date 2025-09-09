import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Send, Users, UserCheck, CreditCard, Activity, DollarSign, TrendingUp, Shield, Edit, Trash2, Plus, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  frozenUsers: number;
  usersByTier: {
    free: number;
    starter: number;
    professional: number;
    enterprise: number;
  };
  totalCreditsInSystem: number;
  averageCreditsPerUser: number;
}

interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if current user is admin
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Get all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: currentUser?.isAdmin === true,
  });

  // Get admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: currentUser?.isAdmin === true,
  });

  // Get all transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    enabled: currentUser?.isAdmin === true,
  });

  // State for modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [selectedTier, setSelectedTier] = useState("");

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    userId: "all" as string,
    title: "",
    message: "",
    type: "admin_message" as string,
    actionUrl: "",
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, updates);
    },
    onSuccess: () => {
      toast({ title: "User updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Grant credits mutation
  const grantCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/grant-credits`, { amount, reason });
    },
    onSuccess: () => {
      toast({ title: "Credits granted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setCreditAmount("");
      setCreditReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error granting credits",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deduct credits mutation
  const deductCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/deduct-credits`, { amount, reason });
    },
    onSuccess: () => {
      toast({ title: "Credits deducted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setCreditAmount("");
      setCreditReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error deducting credits",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Freeze/unfreeze account mutation
  const freezeAccountMutation = useMutation({
    mutationFn: async ({ userId, frozen, reason }: { userId: string; frozen: boolean; reason: string }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/freeze`, { frozen, reason });
    },
    onSuccess: (_, variables) => {
      toast({ title: `Account ${variables.frozen ? "frozen" : "unfrozen"} successfully` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating account status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change tier mutation
  const changeTierMutation = useMutation({
    mutationFn: async ({ userId, tier, grantCredits }: { userId: string; tier: string; grantCredits: boolean }) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/change-tier`, { tier, grantCredits });
    },
    onSuccess: () => {
      toast({ title: "Tier changed successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedTier("");
    },
    onError: (error: any) => {
      toast({
        title: "Error changing tier",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: typeof notificationForm) => {
      return await apiRequest("POST", "/api/notifications", {
        userId: data.userId === "all" ? undefined : data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        actionUrl: data.actionUrl || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification Sent",
        description: notificationForm.userId === "all" ? "Global notification sent to all users" : "Notification sent to user",
      });
      setNotificationForm({
        userId: "all",
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

  if (!currentUser?.isAdmin) {
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

  const totalRevenue = transactions
    .filter(t => t.type === "purchase" && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Full control over users, financials, and system settings</p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active, {stats?.frozenUsers || 0} frozen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.type === "purchase").length} purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCreditsInSystem || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats?.averageCreditsPerUser || 0} per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Tiers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div>Free: {stats?.usersByTier?.free || 0}</div>
              <div>Starter: {stats?.usersByTier?.starter || 0}</div>
              <div>Pro: {stats?.usersByTier?.professional || 0}</div>
              <div>Enterprise: {stats?.usersByTier?.enterprise || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.fullName || user.username}</div>
                          {user.businessName && (
                            <div className="text-sm text-muted-foreground">{user.businessName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.email || user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.tier === "enterprise" ? "default" : "secondary"}>
                          {user.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.credits}</TableCell>
                      <TableCell>
                        <Badge variant={user.accountStatus === "active" ? "default" : "destructive"}>
                          {user.accountStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit User: {user.fullName || user.username}</DialogTitle>
                                <DialogDescription>Manage user account and credits</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Credit Management */}
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(e.target.value)}
                                    className="w-32"
                                  />
                                  <Input
                                    placeholder="Reason"
                                    value={creditReason}
                                    onChange={(e) => setCreditReason(e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      grantCreditsMutation.mutate({
                                        userId: user.id,
                                        amount: parseInt(creditAmount),
                                        reason: creditReason,
                                      });
                                    }}
                                    disabled={!creditAmount || parseInt(creditAmount) <= 0}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Grant
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      deductCreditsMutation.mutate({
                                        userId: user.id,
                                        amount: parseInt(creditAmount),
                                        reason: creditReason,
                                      });
                                    }}
                                    disabled={!creditAmount || parseInt(creditAmount) <= 0}
                                  >
                                    <Minus className="h-4 w-4 mr-1" />
                                    Deduct
                                  </Button>
                                </div>

                                {/* Tier Management */}
                                <div className="flex gap-2">
                                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                                    <SelectTrigger className="w-48">
                                      <SelectValue placeholder="Select tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="free">Free</SelectItem>
                                      <SelectItem value="starter">Starter</SelectItem>
                                      <SelectItem value="professional">Professional</SelectItem>
                                      <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    onClick={() => {
                                      changeTierMutation.mutate({
                                        userId: user.id,
                                        tier: selectedTier,
                                        grantCredits: true,
                                      });
                                    }}
                                    disabled={!selectedTier}
                                  >
                                    Change Tier
                                  </Button>
                                </div>

                                {/* Account Actions */}
                                <div className="flex gap-2">
                                  <Button
                                    variant={user.accountStatus === "frozen" ? "default" : "destructive"}
                                    onClick={() => {
                                      freezeAccountMutation.mutate({
                                        userId: user.id,
                                        frozen: user.accountStatus !== "frozen",
                                        reason: "Admin action",
                                      });
                                    }}
                                  >
                                    {user.accountStatus === "frozen" ? "Unfreeze Account" : "Freeze Account"}
                                  </Button>
                                  {!user.isAdmin && (
                                    <Button
                                      variant="destructive"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this user?")) {
                                          deleteUserMutation.mutate(user.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete User
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All credit and payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 50).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.userName}</div>
                          <div className="text-sm text-muted-foreground">{transaction.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.amount > 0 ? "default" : "destructive"}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-right">
                        <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                          {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Send Notification
              </CardTitle>
              <CardDescription>Send system notifications to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target User</Label>
                <Select
                  value={notificationForm.userId}
                  onValueChange={(value) => setNotificationForm({ ...notificationForm, userId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users (Global)</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName || user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={notificationForm.type}
                  onValueChange={(value) => setNotificationForm({ ...notificationForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="admin_message">Admin Message</SelectItem>
                    <SelectItem value="new_feature">New Feature</SelectItem>
                    <SelectItem value="credit_low">Credit Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Notification title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Notification message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  rows={4}
                />
              </div>

              <Button
                onClick={() => sendNotificationMutation.mutate(notificationForm)}
                disabled={!notificationForm.title || !notificationForm.message}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Platform Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Users</Label>
                    <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  </div>
                  <div>
                    <Label>Active Users</Label>
                    <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
                  </div>
                  <div>
                    <Label>Total Credits in System</Label>
                    <p className="text-2xl font-bold">{stats?.totalCreditsInSystem || 0}</p>
                  </div>
                  <div>
                    <Label>Average Credits per User</Label>
                    <p className="text-2xl font-bold">{stats?.averageCreditsPerUser || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <div className="flex gap-2">
                  <Button variant="outline">Export User Data</Button>
                  <Button variant="outline">Export Transactions</Button>
                  <Button variant="outline">System Backup</Button>
                  <Button variant="outline">Clear Cache</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}