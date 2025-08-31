import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
}

const platforms = [
  { name: "Instagram", icon: "fab fa-instagram", color: "text-pink-500" },
  { name: "Facebook", icon: "fab fa-facebook", color: "text-blue-600" },
  { name: "X (Twitter)", icon: "fab fa-twitter", color: "text-blue-400" },
  { name: "TikTok", icon: "fab fa-tiktok", color: "text-gray-800" },
  { name: "LinkedIn", icon: "fab fa-linkedin", color: "text-blue-700" },
];

export default function PlatformSelector({ selectedPlatforms, onPlatformsChange }: PlatformSelectorProps) {
  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      onPlatformsChange([...selectedPlatforms, platform]);
    } else {
      onPlatformsChange(selectedPlatforms.filter(p => p !== platform));
    }
  };

  return (
    <div>
      <Label className="text-base font-medium mb-3 block">Select Platforms</Label>
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
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
