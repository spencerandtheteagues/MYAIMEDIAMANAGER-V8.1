import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, X, AlertCircle, Info, AlertTriangle, Megaphone } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  type: string;
  requiresPopup: boolean;
  createdAt: string;
}

export function NotificationPopup() {
  const queryClient = useQueryClient();
  const [currentMessage, setCurrentMessage] = useState<AdminMessage | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Poll for new popup messages every 10 seconds
  const { data: popupMessages = [] } = useQuery<AdminMessage[]>({
    queryKey: ["/api/notifications/popup"],
    refetchInterval: 10000, // Poll every 10 seconds
    refetchIntervalInBackground: false,
  });

  // Mark message as delivered mutation
  const markDeliveredMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("POST", `/api/notifications/${notificationId}/delivered`);
    },
    onSuccess: () => {
      // Refresh popup messages
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/popup"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Show new messages as they arrive
  useEffect(() => {
    if (popupMessages.length > 0 && !currentMessage) {
      const nextMessage = popupMessages[0];
      setCurrentMessage(nextMessage);
      setIsOpen(true);
    }
  }, [popupMessages, currentMessage]);

  const handleClose = () => {
    if (currentMessage) {
      // Mark as delivered
      markDeliveredMutation.mutate(currentMessage.id);
    }
    setIsOpen(false);
    
    // Check if there are more messages
    setTimeout(() => {
      setCurrentMessage(null);
    }, 300); // Wait for dialog animation to complete
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "error":
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "announcement":
      case "feature_announcement":
        return <Megaphone className="h-5 w-5 text-blue-500" />;
      case "info":
      case "system_update":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "admin_message":
        return "Admin Message";
      case "system_update":
        return "System Update";
      case "feature_announcement":
        return "New Feature";
      case "maintenance":
        return "Maintenance Notice";
      case "critical":
        return "Critical Alert";
      default:
        return "Notification";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical":
      case "error":
        return "destructive";
      case "warning":
      case "maintenance":
        return "warning";
      case "feature_announcement":
        return "success";
      default:
        return "default";
    }
  };

  if (!currentMessage || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" data-testid="notification-popup">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon(currentMessage.type)}
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {currentMessage.title}
                <Badge variant={getTypeColor(currentMessage.type) as any} className="ml-2">
                  {getTypeLabel(currentMessage.type)}
                </Badge>
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute right-4 top-4"
              data-testid="button-close-notification"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {currentMessage.message}
          </p>
        </div>
        
        <DialogFooter className="mt-6">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-muted-foreground">
              {new Date(currentMessage.createdAt).toLocaleString()}
            </span>
            <Button onClick={handleClose} data-testid="button-acknowledge">
              <Bell className="mr-2 h-4 w-4" />
              Acknowledge
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}