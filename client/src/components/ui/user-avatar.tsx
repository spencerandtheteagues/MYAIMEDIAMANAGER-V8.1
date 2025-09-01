import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface UserAvatarProps {
  user: User | undefined;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const getTierColor = (role: string | undefined, tier: string | undefined) => {
    if (role === "admin") {
      return "bg-gradient-to-br from-primary to-accent border-primary";
    }
    
    switch (tier) {
      case "enterprise":
        return "bg-gradient-to-br from-purple-600 to-purple-800 border-purple-500";
      case "professional":
        return "bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500";
      case "starter":
        return "bg-gradient-to-br from-green-600 to-green-800 border-green-500";
      case "free":
      default:
        return "bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500";
    }
  };

  const getInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className={cn(
        "w-10 h-10 rounded-full bg-gray-300 animate-pulse",
        className
      )} />
    );
  }

  const imageUrl = user.googleAvatar || user.avatar;

  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={user.fullName} 
        className={cn(
          "w-10 h-10 rounded-full object-cover border-2",
          user.role === "admin" ? "border-primary" : "border-transparent",
          className
        )}
      />
    );
  }

  return (
    <div 
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold border-2",
        getTierColor(user.role, user.tier),
        className
      )}
    >
      <span className="text-sm">
        {getInitials(user.fullName)}
      </span>
    </div>
  );
}