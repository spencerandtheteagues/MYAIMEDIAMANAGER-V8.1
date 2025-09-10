// SVG templates for common image prompts
export const svgTemplates: Record<string, (width: number, height: number, color1: string, color2: string) => string> = {
  robot: (width, height, color1, color2) => `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#gradient)" />
      
      <!-- Robot body -->
      <g transform="translate(${width/2}, ${height/2})">
        <!-- Head -->
        <rect x="-60" y="-120" width="120" height="100" rx="10" fill="#4a5568" stroke="#2d3748" stroke-width="3"/>
        
        <!-- Antenna -->
        <line x1="0" y1="-120" x2="0" y2="-150" stroke="#2d3748" stroke-width="4"/>
        <circle cx="0" cy="-150" r="8" fill="#48bb78"/>
        
        <!-- Eyes -->
        <circle cx="-25" cy="-80" r="15" fill="#48bb78"/>
        <circle cx="25" cy="-80" r="15" fill="#48bb78"/>
        <circle cx="-25" cy="-80" r="8" fill="#1a202c"/>
        <circle cx="25" cy="-80" r="8" fill="#1a202c"/>
        
        <!-- Mouth -->
        <rect x="-30" y="-50" width="60" height="8" rx="4" fill="#2d3748"/>
        
        <!-- Body -->
        <rect x="-80" y="-10" width="160" height="140" rx="10" fill="#4a5568" stroke="#2d3748" stroke-width="3"/>
        
        <!-- Control panel -->
        <rect x="-50" y="20" width="100" height="60" rx="5" fill="#2d3748"/>
        <circle cx="-20" cy="40" r="5" fill="#48bb78"/>
        <circle cx="0" cy="40" r="5" fill="#f6e05e"/>
        <circle cx="20" cy="40" r="5" fill="#fc8181"/>
        <rect x="-30" y="55" width="60" height="4" rx="2" fill="#718096"/>
        <rect x="-30" y="62" width="40" height="4" rx="2" fill="#718096"/>
        
        <!-- Arms -->
        <rect x="-100" y="0" width="15" height="80" rx="7" fill="#4a5568" stroke="#2d3748" stroke-width="2"/>
        <rect x="85" y="0" width="15" height="80" rx="7" fill="#4a5568" stroke="#2d3748" stroke-width="2"/>
        <circle cx="-92" cy="85" r="12" fill="#4a5568" stroke="#2d3748" stroke-width="2"/>
        <circle cx="92" cy="85" r="12" fill="#4a5568" stroke="#2d3748" stroke-width="2"/>
        
        <!-- Legs -->
        <rect x="-45" y="130" width="25" height="60" rx="10" fill="#4a5568" stroke="#2d3748" stroke-width="2"/>
        <rect x="20" y="130" width="25" height="60" rx="10" fill="#4a5568" stroke="#2d3748" stroke-width="2"/>
      </g>
      
      <!-- Title text -->
      <text x="50%" y="90%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.04}" fill="white" opacity="0.9">
        AI Robot Assistant
      </text>
    </svg>
  `,
  
  office: (width, height, color1, color2) => `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#gradient)" />
      
      <g transform="translate(${width/2}, ${height/2})">
        <!-- Desk -->
        <rect x="-150" y="30" width="300" height="15" fill="#8b6f47" stroke="#654321" stroke-width="2"/>
        <rect x="-140" y="45" width="20" height="80" fill="#8b6f47"/>
        <rect x="120" y="45" width="20" height="80" fill="#8b6f47"/>
        
        <!-- Computer Monitor -->
        <rect x="-80" y="-60" width="160" height="90" rx="5" fill="#2d3748" stroke="#1a202c" stroke-width="3"/>
        <rect x="-70" y="-50" width="140" height="70" fill="#4299e1"/>
        <rect x="-10" y="30" width="20" height="20" fill="#4a5568"/>
        <rect x="-30" y="50" width="60" height="5" fill="#4a5568"/>
        
        <!-- Keyboard -->
        <rect x="-60" y="5" width="120" height="25" rx="3" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
        
        <!-- Plant -->
        <rect x="90" y="10" width="25" height="20" fill="#8b6f47" stroke="#654321" stroke-width="1"/>
        <circle cx="102" cy="0" r="20" fill="#48bb78"/>
        <circle cx="95" cy="-5" r="15" fill="#68d391"/>
        <circle cx="109" cy="-5" r="15" fill="#68d391"/>
        
        <!-- Lamp -->
        <rect x="-130" y="-10" width="8" height="40" fill="#4a5568"/>
        <path d="M -140 -10 L -115 -10 L -120 -30 L -135 -30 Z" fill="#f6e05e" opacity="0.8"/>
        
        <!-- Window -->
        <rect x="-200" y="-140" width="120" height="100" rx="5" fill="none" stroke="#4a5568" stroke-width="4"/>
        <line x1="-140" y1="-140" x2="-140" y2="-40" stroke="#4a5568" stroke-width="3"/>
        <line x1="-200" y1="-90" x2="-80" y2="-90" stroke="#4a5568" stroke-width="3"/>
      </g>
      
      <text x="50%" y="90%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.04}" fill="white" opacity="0.9">
        Modern Office Workspace
      </text>
    </svg>
  `,
  
  product: (width, height, color1, color2) => `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#gradient)" />
      
      <g transform="translate(${width/2}, ${height/2})">
        <!-- Product Box -->
        <rect x="-100" y="-80" width="200" height="160" rx="15" fill="#fff" opacity="0.95"/>
        <rect x="-100" y="-80" width="200" height="40" rx="15" fill="#667eea"/>
        
        <!-- Product Icon -->
        <circle cx="0" cy="20" r="35" fill="#667eea" opacity="0.2"/>
        <path d="M -15 15 L -15 25 L 15 25 L 15 15 L 0 5 Z" fill="#667eea"/>
        <path d="M -15 15 L 0 5 L 15 15" fill="#764ba2"/>
        
        <!-- Features -->
        <rect x="-70" y="65" width="140" height="8" rx="4" fill="#e2e8f0"/>
        <rect x="-70" y="80" width="100" height="8" rx="4" fill="#e2e8f0"/>
        <rect x="-70" y="95" width="120" height="8" rx="4" fill="#e2e8f0"/>
      </g>
      
      <text x="50%" y="85%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.045}" fill="white" font-weight="bold">
        Premium Product
      </text>
    </svg>
  `,
  
  social: (width, height, color1, color2) => `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#gradient)" />
      
      <g transform="translate(${width/2}, ${height/2})">
        <!-- Phone Frame -->
        <rect x="-90" y="-140" width="180" height="280" rx="20" fill="#2d3748" stroke="#1a202c" stroke-width="3"/>
        <rect x="-80" y="-120" width="160" height="240" rx="15" fill="#fff"/>
        
        <!-- Social Media Icons -->
        <circle cx="-40" cy="-80" r="20" fill="#e53e3e"/>
        <circle cx="0" cy="-80" r="20" fill="#3182ce"/>
        <circle cx="40" cy="-80" r="20" fill="#38a169"/>
        
        <!-- Content Feed -->
        <rect x="-70" y="-30" width="140" height="30" rx="5" fill="#e2e8f0"/>
        <rect x="-70" y="10" width="140" height="30" rx="5" fill="#e2e8f0"/>
        <rect x="-70" y="50" width="140" height="30" rx="5" fill="#e2e8f0"/>
        
        <!-- Engagement Icons -->
        <circle cx="-50" cy="100" r="8" fill="#fc8181"/>
        <circle cx="-20" cy="100" r="8" fill="#4299e1"/>
        <circle cx="10" cy="100" r="8" fill="#48bb78"/>
        <text x="40" y="105" font-family="Arial, sans-serif" font-size="14" fill="#4a5568">1.2k</text>
      </g>
      
      <text x="50%" y="90%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.04}" fill="white" opacity="0.9">
        Social Media Platform
      </text>
    </svg>
  `
};

// Function to determine which template to use based on prompt
export function getTemplateForPrompt(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('robot') || lowerPrompt.includes('bot') || lowerPrompt.includes('ai assistant')) {
    return 'robot';
  }
  if (lowerPrompt.includes('office') || lowerPrompt.includes('workspace') || lowerPrompt.includes('desk')) {
    return 'office';
  }
  if (lowerPrompt.includes('product') || lowerPrompt.includes('package') || lowerPrompt.includes('box')) {
    return 'product';
  }
  if (lowerPrompt.includes('social') || lowerPrompt.includes('media') || lowerPrompt.includes('instagram') || lowerPrompt.includes('facebook')) {
    return 'social';
  }
  
  return null;
}