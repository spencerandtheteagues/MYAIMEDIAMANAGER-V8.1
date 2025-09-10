import React, { useMemo, useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DraftsRail } from "../components/schedule/DraftsRail";
import { ScheduleToolbar } from "../components/schedule/ScheduleToolbar";
import { EventInspector } from "../components/schedule/EventInspector";

dayjs.extend(utc);
dayjs.extend(timezone);

const PLATFORM_COLORS: Record<string, string> = {
  x: "#38bdf8",
  instagram: "#ec4899",
  facebook: "#3b82f6",
  tiktok: "#8b5cf6",
  linkedin: "#06b6d4"
};

interface ScheduleEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps: {
    postId: string;
    platform: string;
    status: string;
    caption: string;
    mediaUrls?: string[];
    tags?: string[];
    needsApproval?: boolean;
  };
}

export default function SchedulePage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [filters, setFilters] = useState<string[]>([]);
  const [tz, setTz] = useState<string>("America/Chicago");
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [view, setView] = useState<string>("timeGridWeek");
  const calendarRef = useRef<FullCalendar>(null);
  const [isLoading, setIsLoading] = useState(false);

  const visibleEvents = useMemo(
    () => filters.length ? events.filter(e => filters.includes(e.extendedProps.platform)) : events,
    [events, filters]
  );

  // Event content renderer with platform colors and status badges
  function eventContent(arg: any) {
    const props = arg.event.extendedProps;
    const color = PLATFORM_COLORS[props.platform.toLowerCase()] || "#a855f7";
    const title = arg.event.title || props.caption?.substring(0, 50) || props.platform.toUpperCase();
    
    return (
      <div 
        className="h-full w-full px-2 py-1 rounded-md cursor-pointer transition-all hover:shadow-lg"
        style={{ 
          backgroundColor: `${color}26`, 
          borderLeft: `3px solid ${color}`,
          borderColor: color
        }}
      >
        <div className="flex items-start justify-between gap-1">
          <span className="truncate text-[11px] font-medium text-zinc-100">{title}</span>
          {props.needsApproval && (
            <Badge className="text-[9px] px-1 py-0" variant="secondary">
              Review
            </Badge>
          )}
        </div>
        {props.status && (
          <div className="mt-1">
            <span className="text-[10px] text-zinc-400 capitalize">
              {props.status.replace("_", " ")}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Fetch events when calendar view changes
  async function fetchEvents(info?: any) {
    setIsLoading(true);
    try {
      const calendarApi = calendarRef.current?.getApi();
      const activeView = info || calendarApi?.view;
      
      if (!activeView) return;
      
      const from = dayjs(activeView.currentStart).tz(tz).format("YYYY-MM-DD");
      const to = dayjs(activeView.currentEnd).tz(tz).format("YYYY-MM-DD");
      
      const response = await fetch(`/api/schedule?from=${from}&to=${to}&tz=${tz}`);
      if (!response.ok) throw new Error("Failed to fetch events");
      
      const data = await response.json();
      
      // Transform API response to FullCalendar events
      const transformedEvents: ScheduleEvent[] = (data.events || []).map((e: any) => {
        const color = PLATFORM_COLORS[e.platform?.toLowerCase()] || "#a855f7";
        return {
          id: e.id,
          title: e.title || e.caption?.substring(0, 50) || e.platform,
          start: e.scheduledAt || e.startsAt,
          end: e.endsAt || dayjs(e.scheduledAt || e.startsAt).add(30, "minutes").toISOString(),
          backgroundColor: `${color}40`,
          borderColor: color,
          extendedProps: {
            postId: e.postId || e.id,
            platform: e.platform || "instagram",
            status: e.status || "draft",
            caption: e.caption || e.content || "",
            mediaUrls: e.mediaUrls || [],
            tags: e.tags || [],
            needsApproval: e.needsApproval || e.status === "needs_approval"
          }
        };
      });
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error loading schedule",
        description: "Failed to load scheduled posts. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Create event from draft
  async function createFromDraft(dropInfo: any, draft: any) {
    try {
      const scheduledAt = dayjs(dropInfo.date).tz(tz).toISOString();
      
      const payload = {
        draftId: draft.id,
        platform: draft.platform,
        scheduledAt,
        caption: draft.caption || draft.content,
        mediaUrls: draft.mediaUrls || [],
        tags: draft.tags || []
      };
      
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (response.status === 409) {
        const { suggestion } = await response.json();
        dropInfo.revert();
        toast({
          title: "Time conflict detected",
          description: suggestion || "Try scheduling at a different time",
          variant: "destructive"
        });
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to schedule post");
      }
      
      toast({
        title: "Post scheduled",
        description: `Scheduled for ${dayjs(scheduledAt).format("MMM D, h:mm A")}`,
      });
      
      // Refresh events
      await fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Scheduling failed",
        description: "Could not schedule this post. Please try again.",
        variant: "destructive"
      });
    }
  }

  // Handle event drop (reschedule)
  async function handleEventDrop(info: any) {
    try {
      const newStart = dayjs(info.event.start).tz(tz).toISOString();
      
      const response = await fetch(`/api/schedule/${info.event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: newStart })
      });
      
      if (response.status === 409) {
        info.revert();
        const { suggestion } = await response.json();
        toast({
          title: "Time conflict",
          description: suggestion || "This time slot has conflicts",
          variant: "destructive"
        });
        return;
      }
      
      if (!response.ok) {
        info.revert();
        throw new Error("Failed to reschedule");
      }
      
      toast({
        title: "Post rescheduled",
        description: `Moved to ${dayjs(newStart).format("MMM D, h:mm A")}`,
      });
    } catch (error) {
      console.error("Error rescheduling:", error);
      info.revert();
      toast({
        title: "Rescheduling failed",
        description: "Could not move this post. Please try again.",
        variant: "destructive"
      });
    }
  }

  // Handle external drop (from drafts)
  async function handleExternalDrop(info: any) {
    const draft = JSON.parse(info.draggedEl.dataset.event || "{}");
    if (!draft.id) return;
    
    await createFromDraft(info, draft);
  }

  // Initialize draggable for drafts
  useEffect(() => {
    const draggableEl = document.getElementById("drafts-container");
    if (draggableEl) {
      new Draggable(draggableEl, {
        itemSelector: ".draft-card",
        eventData: (eventEl: any) => {
          const data = eventEl.dataset.event;
          return data ? JSON.parse(data) : {};
        }
      });
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEvents();
  }, [tz]);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left: Drafts Rail */}
      <div className="w-[280px] border-r border-zinc-800 bg-zinc-950 overflow-hidden">
        <DraftsRail />
      </div>

      {/* Middle: Calendar */}
      <div className="flex-1 bg-zinc-900 p-6">
        <div className="h-full flex flex-col">
          <ScheduleToolbar
            tz={tz}
            onTzChange={setTz}
            filters={filters}
            onFiltersChange={setFilters}
            view={view}
            onViewChange={(v) => {
              setView(v);
              calendarRef.current?.getApi().changeView(v);
            }}
            onToday={() => calendarRef.current?.getApi().today()}
            onPrev={() => calendarRef.current?.getApi().prev()}
            onNext={() => calendarRef.current?.getApi().next()}
          />
          
          <div className="flex-1 mt-4 bg-zinc-950 rounded-2xl border border-zinc-800 p-4">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView={view}
              headerToolbar={false}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="00:30:00"
              slotLabelInterval="01:00:00"
              nowIndicator
              nowIndicatorClassNames="bg-fuchsia-500"
              height="100%"
              eventOverlap={false}
              eventContent={eventContent}
              events={visibleEvents}
              datesSet={fetchEvents}
              droppable
              editable
              eventDrop={handleEventDrop}
              drop={handleExternalDrop}
              eventClick={(info) => setSelectedEvent(info.event as any)}
              scrollTime={dayjs().format("HH:mm:ss")}
              dayMaxEvents={3}
              moreLinkClick="popover"
              weekends={true}
              weekendBackgroundColor="#18181b"
              slotLabelFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short"
              }}
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short"
              }}
            />
          </div>
        </div>
      </div>

      {/* Right: Inspector Panel */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent side="right" className="w-[400px] bg-zinc-950 border-zinc-800">
          <SheetHeader>
            <SheetTitle className="text-zinc-100">Edit Post</SheetTitle>
          </SheetHeader>
          {selectedEvent && (
            <EventInspector
              event={selectedEvent}
              onSaved={() => {
                setSelectedEvent(null);
                fetchEvents();
              }}
              onDeleted={() => {
                setSelectedEvent(null);
                fetchEvents();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}