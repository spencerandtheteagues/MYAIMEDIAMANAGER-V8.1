import { useLocation } from "wouter";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [location] = useLocation();
  const currentPage = pageData[location as keyof typeof pageData] || pageData["/"];

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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Quick Create
          </Button>
        </div>
      </div>
    </header>
  );
}
