import { useQuery } from "@tanstack/react-query";
import { Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrialStatus {
  isTrialUser: boolean;
  trialEndDate: string | null;
  daysRemaining: number;
  hasExpired: boolean;
}

export function TrialCountdown() {
  // Get trial status
  const { data: trialStatus } = useQuery<TrialStatus>({
    queryKey: ["/api/user/trial-status"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Don't show if not a trial user
  if (!trialStatus?.isTrialUser) {
    return null;
  }

  const { daysRemaining, hasExpired } = trialStatus;

  // Determine styling based on days remaining
  const isUrgent = daysRemaining <= 3;
  const isWarning = daysRemaining <= 7;

  if (hasExpired) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span className="font-medium">
            Your free trial has expired. Upgrade now to continue using all features.
          </span>
          <Link href="/pricing">
            <Button size="sm" variant="outline" className="ml-4" data-testid="button-upgrade-expired">
              Upgrade Now
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`
      flex items-center justify-between p-4 mb-4 rounded-lg border
      ${isUrgent ? 'bg-red-950/20 border-red-800' :
        isWarning ? 'bg-yellow-950/20 border-yellow-800' :
        'bg-slate-800/50 border-slate-700'}
    `} data-testid="trial-countdown">
      <div className="flex items-center gap-3">
        <Clock className={`h-5 w-5 ${
          isUrgent ? 'text-red-400' :
          isWarning ? 'text-yellow-400' :
          'text-blue-400'
        }`} />

        <div className="flex items-center gap-2">
          <span className={`font-medium ${
            isUrgent ? 'text-red-100' :
            isWarning ? 'text-yellow-100' :
            'text-blue-100'
          }`}>
            Free Trial:
          </span>
          
          <Badge 
            variant={isUrgent ? "destructive" : isWarning ? "warning" : "default"}
            className="font-bold"
            data-testid="badge-days-remaining"
          >
            {daysRemaining === 0 ? 'Last Day!' : 
             daysRemaining === 1 ? '1 Day Left' : 
             `${daysRemaining} Days Left`}
          </Badge>
          
          {isUrgent && (
            <span className="text-sm text-red-400 font-medium animate-pulse">
              ⚠️ Expiring Soon
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/pricing">
          <Button 
            variant={isUrgent ? "destructive" : "outline"} 
            size="sm"
            data-testid="button-upgrade-trial"
          >
            Upgrade Now
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Compact version for header/navbar
export function TrialCountdownCompact() {
  const { data: trialStatus } = useQuery<TrialStatus>({
    queryKey: ["/api/user/trial-status"],
    refetchInterval: 60000,
  });

  if (!trialStatus?.isTrialUser || trialStatus.hasExpired) {
    return null;
  }

  const { daysRemaining } = trialStatus;
  const isUrgent = daysRemaining <= 3;

  return (
    <Link href="/pricing">
      <Badge 
        variant={isUrgent ? "destructive" : "secondary"}
        className="cursor-pointer hover:opacity-80 transition-opacity"
        data-testid="badge-trial-compact"
      >
        <Clock className="h-3 w-3 mr-1" />
        {daysRemaining === 0 ? 'Trial ends today' : `${daysRemaining} days left`}
      </Badge>
    </Link>
  );
}