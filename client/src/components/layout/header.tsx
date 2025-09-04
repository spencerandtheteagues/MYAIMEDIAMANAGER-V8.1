import { useLocation, Link } from "wouter";
import { Plus, ChevronDown, FileText, Image, Video, CalendarDays, Sparkles, Palette, User, CreditCard, Gift, HelpCircle, LogOut, Crown, Star } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@shared/schema";

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
  "/settings": {
    title: "Settings",
    subtitle: "Configure your account and platform settings"
  }
};

export default function Header() {
  const [location, setLocation] = useLocation();
  const currentPage = pageData[location as keyof typeof pageData] || pageData["/"];
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [theme, setTheme] = useState<'neon-pink' | 'neon-blue' | 'professional'>(() => {
    return (localStorage.getItem('app-theme') as any) || 'neon-pink';
  });
  const { toast } = useToast();
  
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });
  
  const handleLogout = () => {
    // Clear auth and redirect to login
    window.location.href = '/auth/logout';
  };
  
  const getTierDisplay = (tier?: string) => {
    switch(tier) {
      case 'enterprise': return { name: 'Enterprise', icon: Crown, color: 'bg-purple-500' };
      case 'professional': return { name: 'Professional', icon: Star, color: 'bg-blue-500' };
      case 'starter': return { name: 'Starter', color: 'bg-green-500' };
      default: return { name: 'Free Trial', color: 'bg-gray-500' };
    }
  };
  
  const tierInfo = getTierDisplay(user?.tier);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return (
    <header className="bg-card shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{currentPage.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{currentPage.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Palette className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setTheme('neon-pink')}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Neon Pink</span>
                  {theme === 'neon-pink' && <div className="w-2 h-2 rounded-full bg-pink-500" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('neon-blue')}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Neon Blue</span>
                  {theme === 'neon-blue' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('professional')}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Professional</span>
                  {theme === 'professional' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationsBell />
          
          {/* User Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative p-0 h-auto">
                <UserAvatar user={user} className="w-10 h-10" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-3 border-b">
                <p className="font-semibold">{user?.fullName || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className={`${tierInfo.color} text-white`}>
                    {tierInfo.icon && <tierInfo.icon className="w-3 h-3 mr-1" />}
                    {tierInfo.name}
                  </Badge>
                  {user?.credits && (
                    <Badge variant="outline">
                      {user.credits} Credits
                    </Badge>
                  )}
                </div>
              </div>
              
              <DropdownMenuItem onClick={() => setLocation('/settings')} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setLocation('/billing')} className="cursor-pointer">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing & Upgrade
                {user?.tier === 'free' && (
                  <Badge variant="default" className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Upgrade
                  </Badge>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setLocation('/referrals')} className="cursor-pointer">
                <Gift className="w-4 h-4 mr-2" />
                Referral Program
                <Badge variant="outline" className="ml-auto">
                  New!
                </Badge>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setLocation('/help')} className="cursor-pointer">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg transition-all hover:shadow-xl">
                <Plus className="w-4 h-4 mr-2" />
                Quick Create
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Choose Content Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setLocation('/create?type=text');
                  setIsQuickCreateOpen(false);
                }}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                <span>Text Post</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setLocation('/create?type=text-image');
                  setIsQuickCreateOpen(false);
                }}
                className="cursor-pointer"
              >
                <Image className="w-4 h-4 mr-2 text-green-500" />
                <span>Image + Text</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setLocation('/create?type=text-video');
                  setIsQuickCreateOpen(false);
                }}
                className="cursor-pointer"
              >
                <Video className="w-4 h-4 mr-2 text-purple-500" />
                <span>Video + Text</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setLocation('/calendar');
                  setIsQuickCreateOpen(false);
                }}
                className="cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 mr-2 text-orange-500" />
                <span>Schedule Post</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setLocation('/campaigns');
                  setIsQuickCreateOpen(false);
                }}
                className="cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-2 text-pink-500" />
                <span>AI Campaign (7 days)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
