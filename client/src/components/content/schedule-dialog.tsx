import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Post } from "@shared/schema";

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { scheduledFor: Date; platforms: string[] }) => void;
  post: Post;
  isProcessing?: boolean;
}

const PLATFORMS = [
  "Instagram",
  "Facebook", 
  "X (Twitter)",
  "TikTok",
  "LinkedIn"
];

export default function ScheduleDialog({ open, onClose, onConfirm, post, isProcessing }: ScheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(post.platforms || ["Instagram"]);

  const handlePlatformToggle = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleConfirm = () => {
    if (!selectedDate || selectedPlatforms.length === 0) return;
    
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledFor = new Date(selectedDate);
    scheduledFor.setHours(hours, minutes, 0, 0);
    
    onConfirm({ scheduledFor, platforms: selectedPlatforms });
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const label = format(new Date(2024, 0, 1, hour, minute), "h:mm a");
        options.push({ value: time, label });
      }
    }
    return options;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Post for Publishing</DialogTitle>
          <DialogDescription>
            Choose when to publish this post and on which platforms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Post Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Post Preview:</p>
            <p className="text-sm">{post.content.slice(0, 100)}...</p>
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {post.mediaUrls[0].includes('video') ? '📹 Video attached' : '🖼️ Image attached'}
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Select Date
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Select Time
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {generateTimeOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Select Platforms</Label>
            <div className="space-y-3">
              {PLATFORMS.map(platform => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform}
                    checked={selectedPlatforms.includes(platform)}
                    onCheckedChange={() => handlePlatformToggle(platform)}
                    data-testid={`checkbox-platform-${platform.toLowerCase()}`}
                  />
                  <Label 
                    htmlFor={platform} 
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <i className={`fab fa-${platform.toLowerCase().replace(' (twitter)', '').replace('x ', 'twitter')}`} />
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
            {selectedPlatforms.length === 0 && (
              <p className="text-sm text-destructive">Please select at least one platform</p>
            )}
          </div>

          {/* Summary */}
          {selectedDate && selectedPlatforms.length > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium mb-1">Scheduling Summary:</p>
              <p className="text-sm">
                Post will be published on {format(selectedDate, "MMMM d, yyyy")} at {format(new Date(2024, 0, 1, ...selectedTime.split(":").map(Number)), "h:mm a")}
              </p>
              <p className="text-sm mt-1">
                Platforms: {selectedPlatforms.join(", ")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isProcessing || !selectedDate || selectedPlatforms.length === 0}
            data-testid="button-confirm-schedule"
          >
            {isProcessing ? "Scheduling..." : "Approve & Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}