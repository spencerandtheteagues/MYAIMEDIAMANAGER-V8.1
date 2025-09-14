import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Calendar, 
  CheckCircle, 
  BarChart3, 
  FolderOpen, 
  Settings,
  Rocket,
  Share2,
  CalendarDays,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Logo } from "@/components/ui/logo";
import { useQuery } from "@tanstack/react-query";
import type { Post, User } from "@shared/schema";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Create Content", href: "/create", icon: PlusCircle },
  { name: "Campaigns", href: "/campaigns", icon: Rocket },
  { name: "Schedule", href: "/schedule", icon: CalendarDays },
  { name: "Platforms", href: "/platforms", icon: Share2 },
  { name: "Content Calendar", href: "/calendar", icon: Calendar },
  { name: "Approval Queue", href: "/approval", icon: CheckCircle, badge: true },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Content Library", href: "/library", icon: FolderOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: pendingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts", "pending"],
  });

  return (
    <aside className="w-64 shadow-lg flex flex-col bg-sidebar">
      <div className="p-6 border-b border-sidebar-border">
        <Logo size="md" animated={true} />
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.badge && pendingPosts && pendingPosts.length > 0 && (
                  <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800">
                    {pendingPosts.length}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
        
        {/* Admin Panel - only show for admin users */}
        {user?.role === "admin" && (
          <Link href="/admin">
            <div
              className={cn(
                "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer mt-2",
                location === "/admin"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Shield className="w-5 h-5" />
              <span>Admin Panel</span>
              <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-500">
                Admin
              </Badge>
            </div>
          </Link>
        )}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <UserAvatar user={user} />
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">
              {user?.fullName || "Loading..."}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-400">
                {user?.businessName || "Business Owner"}
              </p>
              {user?.role === "admin" && (
                <span className="text-xs px-1.5 py-0.5 bg-red-600/10 text-red-600 rounded font-semibold">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {user?.credits ? `${user.credits.toLocaleString()} credits` : ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
