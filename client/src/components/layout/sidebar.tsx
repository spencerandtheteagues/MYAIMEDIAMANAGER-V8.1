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
  Shield,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Logo } from "@/components/ui/logo";
import { useQuery } from "@tanstack/react-query";
import type { Post, User } from "@shared/schema";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Create Content", href: "/create", icon: PlusCircle },
  { name: "AI Brainstorm", href: "/ai-brainstorm", icon: Sparkles },
  { name: "Campaigns", href: "/campaigns", icon: Rocket },
  { name: "Platforms", href: "/platforms", icon: Share2 },
  { name: "Content Calendar", href: "/calendar", icon: Calendar },
  { name: "Approval Queue", href: "/approval", icon: CheckCircle, badge: true },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Content Library", href: "/library", icon: FolderOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const [location] = useLocation();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: pendingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts", "pending"],
  });

  return (
    <aside className="w-64 shadow-lg flex flex-col bg-background relative border-4 border-primary/50 rounded-lg m-3">
      <div className="p-6 border-b border-border">
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
                    ? "bg-primary text-white shadow-lg shadow-primary/50 border border-primary"
                    : "text-gray-300 hover:bg-muted hover:text-white"
                )}
                onClick={onNavigate}
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
                  ? "bg-primary text-white shadow-lg shadow-primary/50 border border-primary"
                  : "text-gray-300 hover:bg-muted hover:text-white"
              )}
              onClick={onNavigate}
            >
              <Shield className="w-5 h-5" />
              <span>Admin Panel</span>
              <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary">
                Admin
              </Badge>
            </div>
          </Link>
        )}
      </nav>

      <div className="p-4">
        <div className="flex items-center space-x-3">
          <UserAvatar user={user} />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
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
