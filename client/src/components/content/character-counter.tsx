import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  content: string;
  limit: number;
  className?: string;
}

export default function CharacterCounter({ content, limit, className }: CharacterCounterProps) {
  const count = content.length;
  const remaining = limit - count;
  const isOverLimit = count > limit;
  const isNearLimit = remaining <= limit * 0.1; // Warning when 90% full

  return (
    <div className={cn("flex items-center justify-between text-xs", className)}>
      <div className="text-muted-foreground">
        {count.toLocaleString()} / {limit.toLocaleString()} characters
      </div>
      <Badge
        variant={isOverLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
        className={cn(
          "text-xs",
          isOverLimit && "bg-red-500 text-white",
          isNearLimit && !isOverLimit && "bg-yellow-500 text-black"
        )}
      >
        {remaining >= 0 ? `${remaining.toLocaleString()} left` : `${Math.abs(remaining).toLocaleString()} over`}
      </Badge>
    </div>
  );
}