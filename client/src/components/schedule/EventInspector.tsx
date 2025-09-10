import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Save, Send, Clock, Tag, Image, AlertCircle } from "lucide-react";
import dayjs from "dayjs";

interface EventInspectorProps {
  event: any;
  onSaved: () => void;
  onDeleted: () => void;
}

export function EventInspector({ event, onSaved, onDeleted }: EventInspectorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    caption: "",
    tags: "",
    scheduledAt: "",
    requiresApproval: false,
    notes: ""
  });

  useEffect(() => {
    if (event) {
      const props = event.extendedProps || {};
      setForm({
        caption: props.caption || "",
        tags: (props.tags || []).join(", "),
        scheduledAt: dayjs(event.start).format("YYYY-MM-DDTHH:mm"),
        requiresApproval: props.needsApproval || false,
        notes: props.notes || ""
      });
    }
  }, [event]);

  if (!event) return null;

  const props = event.extendedProps || {};

  async function handleSave() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/schedule/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: form.caption,
          tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          requiresApproval: form.requiresApproval,
          notes: form.notes
        })
      });

      if (!response.ok) throw new Error("Failed to update");

      toast({
        title: "Post updated",
        description: "Your changes have been saved",
      });
      onSaved();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to unschedule this post?")) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/schedule/${event.id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast({
        title: "Post unscheduled",
        description: "The post has been removed from the schedule",
      });
      onDeleted();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not remove the post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePublishNow() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/schedule/${event.id}/publish`, {
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to publish");

      toast({
        title: "Post published",
        description: "Your post has been published successfully",
      });
      onSaved();
    } catch (error) {
      toast({
        title: "Publish failed",
        description: "Could not publish the post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      facebook: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      x: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      twitter: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      tiktok: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      linkedin: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    };
    return colors[platform.toLowerCase()] || "bg-zinc-700/10 text-zinc-400 border-zinc-700/20";
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Platform & Status */}
      <div className="flex items-center justify-between">
        <Badge 
          variant="outline" 
          className={`${getPlatformColor(props.platform)}`}
        >
          {props.platform?.toUpperCase() || "PLATFORM"}
        </Badge>
        <Badge variant={props.status === "scheduled" ? "default" : "secondary"}>
          {props.status || "draft"}
        </Badge>
      </div>

      {/* Media Preview */}
      {props.mediaUrls && props.mediaUrls.length > 0 && (
        <div className="rounded-lg border border-zinc-800 p-2">
          <div className="flex items-center gap-2 mb-2">
            <Image className="h-3 w-3 text-zinc-500" />
            <span className="text-xs text-zinc-500">Media attachments</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {props.mediaUrls.slice(0, 3).map((url: string, i: number) => (
              <div key={i} className="aspect-square rounded bg-zinc-800" />
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-zinc-800" />

      {/* Edit Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="caption" className="text-xs text-zinc-400">
            Caption
          </Label>
          <Textarea
            id="caption"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
            className="mt-1 min-h-[100px] bg-zinc-900 border-zinc-800 text-sm"
            placeholder="Write your caption..."
          />
        </div>

        <div>
          <Label htmlFor="tags" className="text-xs text-zinc-400">
            <Tag className="inline h-3 w-3 mr-1" />
            Tags (comma separated)
          </Label>
          <Input
            id="tags"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="mt-1 bg-zinc-900 border-zinc-800 text-sm"
            placeholder="marketing, product, launch"
          />
        </div>

        <div>
          <Label htmlFor="scheduledAt" className="text-xs text-zinc-400">
            <Clock className="inline h-3 w-3 mr-1" />
            Scheduled Time
          </Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            className="mt-1 bg-zinc-900 border-zinc-800 text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="approval" className="text-xs text-zinc-400">
            Requires Approval
          </Label>
          <Switch
            id="approval"
            checked={form.requiresApproval}
            onCheckedChange={(checked) => setForm({ ...form, requiresApproval: checked })}
          />
        </div>

        {form.requiresApproval && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-400">Approval Required</p>
                <p className="text-xs text-zinc-400 mt-1">
                  This post will need approval before it can be published
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="notes" className="text-xs text-zinc-400">
            Internal Notes
          </Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="mt-1 min-h-[60px] bg-zinc-900 border-zinc-800 text-sm"
            placeholder="Add notes for your team..."
          />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isLoading}
          className="text-red-400 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Unschedule
        </Button>

        <div className="flex gap-2">
          {props.status === "scheduled" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublishNow}
              disabled={isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Publish Now
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}