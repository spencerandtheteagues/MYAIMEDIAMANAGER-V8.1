import { useLocation } from "wouter";
import { Bell, Plus, Coins, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const pageData = {
  "/": {
    title: "Dashboard",
    subtitle: "Welcome back! Here's your social media overview."
  },
  "/create": {
    title: "Create Content",
    subtitle: "Create engaging posts with AI assistance"
  },
  "/calendar": {
    title: "Content Calendar",
    subtitle: "View and manage your scheduled posts"
  },
  "/approval": {
    title: "Approval Queue",
    subtitle: "Review and approve content before publishing"
  },
  "/analytics": {
    title: "Analytics",
    subtitle: "Track your social media performance across all platforms"
  },
  "/library": {
    title: "Content Library",
    subtitle: "Manage all your content drafts and published posts"
  },
  "/campaigns": {
    title: "Campaigns",
    subtitle: "Manage your social media campaigns"
  },
  "/pricing": {
    title: "Pricing Plans",
    subtitle: "Choose the perfect plan for your business"
  },
  "/settings": {
    title: "Settings",
    subtitle: "Configure your account and platform settings"
  }
};

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: User | null | undefined; isLoading: boolean; isAuthenticated: boolean };
  const currentPage = pageData[location as keyof typeof pageData] || pageData["/"];

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getSubscriptionBadgeColor = (status?: string | null) => {
    switch (status) {
      case "free":
        return "secondary";
      case "trial":
        return "outline";
      case "active":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <header className="bg-card shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{currentPage.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{currentPage.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Credits Display */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{user.credits || 0} credits</span>
              <Badge variant={getSubscriptionBadgeColor(user.subscriptionStatus)} className="text-xs">
                {user.subscriptionStatus === "free" ? "Free" : 
                 user.subscriptionStatus === "trial" ? "Trial" : 
                 user.subscriptionStatus === "active" ? "Pro" : 
                 user.subscriptionStatus || "Free"}
              </Badge>
            </div>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* Quick Create */}
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Quick Create
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.profileImageUrl || undefined} alt="User" />
                    <AvatarFallback>
                      {getInitials(user.firstName, user.lastName, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.firstName && user.lastName && (
                      <p className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                    )}
                    {user.email && (
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/pricing"}>
                  <Coins className="mr-2 h-4 w-4" />
                  <span>Upgrade Plan</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => window.location.href = "/api/logout"}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
