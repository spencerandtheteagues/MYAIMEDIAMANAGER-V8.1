import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function Logo({ className, size = "md", animated = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };
  
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className="relative">
        {/* Outer hexagon container */}
        <svg
          viewBox="0 0 100 100"
          className={cn(
            sizeClasses[size],
            "relative z-10",
            animated && "animate-pulse"
          )}
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(280, 100%, 60%)" />
              <stop offset="50%" stopColor="hsl(300, 100%, 50%)" />
              <stop offset="100%" stopColor="hsl(320, 100%, 60%)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Hexagon shape */}
          <path
            d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z"
            fill="none"
            stroke="url(#logo-gradient)"
            strokeWidth="3"
            filter="url(#glow)"
          />
          
          {/* Inner AI symbol - stylized brain/circuit hybrid */}
          <g transform="translate(50, 50)">
            {/* Central node */}
            <circle cx="0" cy="0" r="4" fill="url(#logo-gradient)" />
            
            {/* Connection lines */}
            <path
              d="M0,0 L-15,-10 M0,0 L15,-10 M0,0 L-15,10 M0,0 L15,10"
              stroke="url(#logo-gradient)"
              strokeWidth="2"
              opacity="0.8"
            />
            
            {/* Outer nodes */}
            <circle cx="-15" cy="-10" r="3" fill="url(#logo-gradient)" opacity="0.8" />
            <circle cx="15" cy="-10" r="3" fill="url(#logo-gradient)" opacity="0.8" />
            <circle cx="-15" cy="10" r="3" fill="url(#logo-gradient)" opacity="0.8" />
            <circle cx="15" cy="10" r="3" fill="url(#logo-gradient)" opacity="0.8" />
            
            {/* Additional circuit lines */}
            <path
              d="M-15,-10 L0,-20 L15,-10 M-15,10 L0,20 L15,10"
              stroke="url(#logo-gradient)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
            />
          </g>
        </svg>
        
        {/* Animated glow effect */}
        {animated && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-30 blur-xl animate-pulse" />
        )}
      </div>
      
      <div className="flex flex-col">
        <h1 
          className={cn(
            textSizes[size],
            "font-display font-black tracking-wider bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          )}
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          MYAI
        </h1>
        <span 
          className={cn(
            size === "lg" ? "text-xs" : "text-[10px]",
            "font-medium tracking-[0.3em] text-muted-foreground uppercase"
          )}
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          MediaMgr.com
        </span>
      </div>
    </div>
  );
}