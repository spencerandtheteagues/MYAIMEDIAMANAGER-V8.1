import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, List, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PLATFORMS = [
  { id: "instagram", label: "IG", color: "bg-pink-500" },
  { id: "facebook", label: "FB", color: "bg-blue-500" },
  { id: "x", label: "X", color: "bg-sky-500" },
  { id: "tiktok", label: "TT", color: "bg-violet-500" },
  { id: "linkedin", label: "LI", color: "bg-cyan-500" },
];

const TIMEZONES = [
  { value: "America/New_York", label: "ET - New York" },
  { value: "America/Chicago", label: "CT - Chicago" },
  { value: "America/Denver", label: "MT - Denver" },
  { value: "America/Los_Angeles", label: "PT - Los Angeles" },
  { value: "Europe/London", label: "GMT - London" },
  { value: "Europe/Paris", label: "CET - Paris" },
  { value: "Asia/Tokyo", label: "JST - Tokyo" },
  { value: "Asia/Singapore", label: "SGT - Singapore" },
  { value: "Australia/Sydney", label: "AEDT - Sydney" },
];

interface ScheduleToolbarProps {
  tz: string;
  onTzChange: (tz: string) => void;
  filters: string[];
  onFiltersChange: (filters: string[]) => void;
  view: string;
  onViewChange: (view: string) => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ScheduleToolbar({
  tz,
  onTzChange,
  filters,
  onFiltersChange,
  view,
  onViewChange,
  onToday,
  onPrev,
  onNext
}: ScheduleToolbarProps) {
  const toggleFilter = (platform: string) => {
    if (filters.includes(platform)) {
      onFiltersChange(filters.filter(f => f !== platform));
    } else {
      onFiltersChange([...filters, platform]);
    }
  };

  const handleAutoSchedule = async () => {
    // TODO: Implement AI-powered auto-scheduling
    console.log("Auto-schedule triggered");
  };

  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-800">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToday}
          className="h-8 px-3 text-xs"
        >
          Today
        </Button>
        
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* View Switcher */}
        <ToggleGroup 
          type="single" 
          value={view} 
          onValueChange={(v) => v && onViewChange(v)}
          className="h-8"
        >
          <ToggleGroupItem value="dayGridMonth" size="sm" className="h-8 px-3">
            <Calendar className="h-3 w-3 mr-1" />
            Month
          </ToggleGroupItem>
          <ToggleGroupItem value="timeGridWeek" size="sm" className="h-8 px-3">
            <CalendarDays className="h-3 w-3 mr-1" />
            Week
          </ToggleGroupItem>
          <ToggleGroupItem value="timeGridDay" size="sm" className="h-8 px-3">
            <Calendar className="h-3 w-3 mr-1" />
            Day
          </ToggleGroupItem>
          <ToggleGroupItem value="listWeek" size="sm" className="h-8 px-3">
            <List className="h-3 w-3 mr-1" />
            Agenda
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Middle: Platform Filters */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Platforms:</span>
        <div className="flex items-center gap-1">
          {PLATFORMS.map((platform) => {
            const isActive = filters.length === 0 || filters.includes(platform.id);
            return (
              <Button
                key={platform.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(platform.id)}
                className={`h-7 px-2 text-[10px] ${
                  isActive ? "" : "opacity-50"
                }`}
              >
                <span className={`w-2 h-2 rounded-full mr-1 ${platform.color}`} />
                {platform.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Right: Timezone & AI */}
      <div className="flex items-center gap-2">
        <Select value={tz} onValueChange={onTzChange}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((timezone) => (
              <SelectItem key={timezone.value} value={timezone.value} className="text-xs">
                {timezone.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          onClick={handleAutoSchedule}
          className="h-8 px-3 text-xs border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
        >
          <Sparkles className="h-3 w-3 mr-1 text-emerald-500" />
          Auto-Schedule
        </Button>
      </div>
    </div>
  );
}