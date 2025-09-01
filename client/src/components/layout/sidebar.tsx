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
  Bot,
  Rocket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Post, User } from "@shared/schema";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Create Content", href: "/create", icon: PlusCircle },
  { name: "Campaigns", href: "/campaigns", icon: Rocket },
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
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="text-primary-foreground w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-foreground">MyAiMediaMgr</h1>
        </div>
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
          <img 
            src={user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop"} 
            alt="User profile" 
            className="w-10 h-10 rounded-full object-cover" 
          />
          <div>
            <p className="text-sm font-medium text-foreground">
              {user?.fullName || "Loading..."}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.businessName || "Business Owner"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
