import { useLocation, Link } from "wouter";
import { Bell, Plus, ChevronDown, FileText, Image, Video, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

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

  return (
    <header className="bg-card shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{currentPage.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{currentPage.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full" />
          </Button>
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
                  setLocation('/create');
                  setIsQuickCreateOpen(false);
                }}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                <span>Text Post</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setLocation('/create');
                  setIsQuickCreateOpen(false);
                }}
                className="cursor-pointer"
              >
                <Image className="w-4 h-4 mr-2 text-green-500" />
                <span>Image + Text</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setLocation('/create');
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
