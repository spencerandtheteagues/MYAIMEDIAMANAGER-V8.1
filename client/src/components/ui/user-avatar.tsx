import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface UserAvatarProps {
  user: User | undefined;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const getTierColor = (role: string | undefined, tier: string | undefined) => {
    // Admin and employee accounts get special styling
    if (role === "admin" || role === "employee") {
      if (role === "admin") {
        return "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400 shadow-amber-500/30";
      }
      return "bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 shadow-indigo-500/30";
    }
    
    // Customer accounts colored by tier
    switch (tier) {
      case "enterprise":
        return "bg-gradient-to-br from-purple-500 to-pink-600 border-purple-400 shadow-purple-500/30";
      case "professional":
        return "bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-400 shadow-blue-500/30";
      case "starter":
        return "bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 shadow-green-500/30";
      case "free":
      default:
        return "bg-gradient-to-br from-gray-500 to-slate-600 border-gray-400 shadow-gray-500/30";
    }
  };

  const getInitials = (fullName: string) => {
    if (!fullName || fullName.trim() === '') {
      return 'U';
    }
    
    const names = fullName.trim().split(/\s+/);
    if (names.length >= 2) {
      // Get first letter of first name and first letter of last name
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    // If only one name, get first two letters
    return names[0].slice(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className={cn(
        "w-10 h-10 rounded-full bg-gray-300 animate-pulse",
        className
      )} />
    );
  }

  // Always show initials, never use image avatars for consistency
  const initials = getInitials(user.fullName || user.username || 'User');
  const isInternalAccount = user.role === 'admin' || user.role === 'employee';
  
  return (
    <div 
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 shadow-lg",
        getTierColor(user.role, user.tier),
        isInternalAccount && "ring-2 ring-offset-2 ring-offset-background",
        isInternalAccount && user.role === "admin" && "ring-amber-400",
        isInternalAccount && user.role === "employee" && "ring-indigo-400",
        className
      )}
      title={`${user.fullName}${isInternalAccount ? ` (${user.role === 'admin' ? 'Admin' : 'Staff'})` : ''}`}
    >
      <span className="text-sm font-bold tracking-wide">
        {initials}
      </span>
    </div>
  );
}