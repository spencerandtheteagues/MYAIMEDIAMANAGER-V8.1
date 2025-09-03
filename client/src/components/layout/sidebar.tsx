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
  Share2
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
    <aside className="w-64 bg-card shadow-lg flex flex-col">
      <div className="p-6 border-b border-border bg-gradient-to-r from-transparent via-purple-900/10 to-transparent">
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
                    ? "bg-accent text-accent-foreground border border-border"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <UserAvatar user={user} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {user?.fullName || "Loading..."}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">
                {user?.businessName || "Business Owner"}
              </p>
              {user?.role === "admin" && (
                <span className="text-xs px-1.5 py-0.5 bg-red-600/10 text-red-600 rounded font-semibold">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.credits ? `${user.credits.toLocaleString()} credits` : ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
