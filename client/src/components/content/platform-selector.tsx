import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  onCharacterLimitChange?: (limit: number) => void;
}

const platforms = [
  { name: "Instagram", icon: "fab fa-instagram", color: "text-pink-500", limit: 2200 },
  { name: "Facebook", icon: "fab fa-facebook", color: "text-blue-600", limit: 63206 },
  { name: "X (Twitter)", icon: "fab fa-twitter", color: "text-blue-400", limit: 280 },
  { name: "TikTok", icon: "fab fa-tiktok", color: "text-gray-800", limit: 300 },
  { name: "LinkedIn", icon: "fab fa-linkedin", color: "text-blue-700", limit: 3000 },
];

export default function PlatformSelector({ selectedPlatforms, onPlatformsChange, onCharacterLimitChange }: PlatformSelectorProps) {
  const [characterLimit, setCharacterLimit] = useState<number>(280);

  const handlePlatformChange = (platform: string, checked: boolean) => {
    let newPlatforms: string[];
    if (checked) {
      newPlatforms = [...selectedPlatforms, platform];
    } else {
      newPlatforms = selectedPlatforms.filter(p => p !== platform);
    }
    onPlatformsChange(newPlatforms);
  };

  // Update character limit when platforms change
  useEffect(() => {
    const updateCharacterLimit = async () => {
      if (selectedPlatforms.length === 0) {
        setCharacterLimit(280); // Default to Twitter limit
        onCharacterLimitChange?.(280);
        return;
      }

      try {
        const response = await apiRequest("POST", "/api/content/character-limit", {
          platforms: selectedPlatforms
        });
        const data = await response.json();
        setCharacterLimit(data.characterLimit);
        onCharacterLimitChange?.(data.characterLimit);
      } catch (error) {
        // Fallback to calculating locally
        const limits = selectedPlatforms.map(platform => {
          const platformData = platforms.find(p => p.name === platform);
          return platformData?.limit || 280;
        });
        const minLimit = Math.min(...limits);
        setCharacterLimit(minLimit);
        onCharacterLimitChange?.(minLimit);
      }
    };

    updateCharacterLimit();
  }, [selectedPlatforms, onCharacterLimitChange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-base font-medium">Select Platforms</Label>
        {selectedPlatforms.length > 0 && (
          <Badge variant="outline" className="text-xs">
            Character Limit: {characterLimit.toLocaleString()}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        {platforms.map((platform) => (
          <div key={platform.name} className="flex items-center space-x-2">
            <Checkbox
              id={platform.name}
              checked={selectedPlatforms.includes(platform.name)}
              onCheckedChange={(checked) => handlePlatformChange(platform.name, checked as boolean)}
            />
            <Label
              htmlFor={platform.name}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <i className={`${platform.icon} ${platform.color}`} />
              <span className="text-sm text-foreground">{platform.name}</span>
              <Badge variant="secondary" className="text-xs ml-1">
                {platform.limit.toLocaleString()}
              </Badge>
            </Label>
          </div>
        ))}
      </div>
      {selectedPlatforms.length > 1 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Content will be limited to {characterLimit.toLocaleString()} characters (most restrictive platform)
        </div>
      )}
    </div>
  );
}
