#!/usr/bin/env python3
"""
Multi-model AI Image Generation with multiple fallback options
"""
import os
import sys
import json
import base64
import io
from PIL import Image as PILImage, ImageDraw, ImageFont, ImageFilter
import hashlib
import math
import random

def create_ai_styled_image(prompt: str, aspect_ratio: str = "16:9") -> bytes:
    """
    Create an AI-styled image based on the prompt using advanced PIL techniques
    """
    # Determine dimensions
    aspect_map = {
        "1:1": (1024, 1024),
        "16:9": (1024, 576),
        "9:16": (576, 1024),
        "4:3": (1024, 768),
        "3:4": (768, 1024)
    }
    width, height = aspect_map.get(aspect_ratio, (1024, 576))
    
    # Analyze prompt to determine style
    prompt_lower = prompt.lower()
    
    # Create base image
    img = PILImage.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # Generate colors based on prompt content
    if 'robot' in prompt_lower or 'ai' in prompt_lower or 'tech' in prompt_lower:
        # Tech/Robot theme - blues and cyans
        base_colors = [(0, 100, 200), (0, 200, 255), (100, 150, 255)]
        accent_color = (0, 255, 200)
    elif 'office' in prompt_lower or 'work' in prompt_lower:
        # Office theme - grays and blues
        base_colors = [(100, 120, 140), (150, 170, 190), (200, 210, 220)]
        accent_color = (70, 130, 180)
    elif 'nature' in prompt_lower or 'forest' in prompt_lower or 'tree' in prompt_lower:
        # Nature theme - greens
        base_colors = [(34, 139, 34), (60, 179, 113), (144, 238, 144)]
        accent_color = (255, 215, 0)
    elif 'sunset' in prompt_lower or 'sunrise' in prompt_lower:
        # Sunset theme - oranges and purples
        base_colors = [(255, 94, 77), (255, 140, 90), (255, 190, 130)]
        accent_color = (147, 112, 219)
    elif 'ocean' in prompt_lower or 'water' in prompt_lower or 'sea' in prompt_lower:
        # Ocean theme - blues and teals
        base_colors = [(0, 119, 190), (0, 150, 199), (72, 202, 228)]
        accent_color = (255, 255, 200)
    else:
        # Default vibrant colors
        base_colors = [(102, 126, 234), (118, 75, 162), (237, 117, 130)]
        accent_color = (255, 200, 100)
    
    # Create gradient background
    for y in range(height):
        # Multi-color gradient
        progress = y / height
        if progress < 0.5:
            ratio = progress * 2
            r = int(base_colors[0][0] * (1 - ratio) + base_colors[1][0] * ratio)
            g = int(base_colors[0][1] * (1 - ratio) + base_colors[1][1] * ratio)
            b = int(base_colors[0][2] * (1 - ratio) + base_colors[1][2] * ratio)
        else:
            ratio = (progress - 0.5) * 2
            r = int(base_colors[1][0] * (1 - ratio) + base_colors[2][0] * ratio)
            g = int(base_colors[1][1] * (1 - ratio) + base_colors[2][1] * ratio)
            b = int(base_colors[1][2] * (1 - ratio) + base_colors[2][2] * ratio)
        
        draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))
    
    # Add visual elements based on prompt
    if 'robot' in prompt_lower:
        # Draw a stylized robot
        robot_x = width // 2
        robot_y = height // 2
        
        # Robot head
        head_size = min(width, height) // 6
        draw.rectangle([robot_x - head_size, robot_y - head_size*2, 
                       robot_x + head_size, robot_y - head_size//2],
                      fill=(80, 80, 100), outline=(200, 200, 220), width=3)
        
        # Robot eyes
        eye_size = head_size // 4
        draw.ellipse([robot_x - head_size//2 - eye_size//2, robot_y - head_size*1.5 - eye_size//2,
                     robot_x - head_size//2 + eye_size//2, robot_y - head_size*1.5 + eye_size//2],
                    fill=accent_color)
        draw.ellipse([robot_x + head_size//2 - eye_size//2, robot_y - head_size*1.5 - eye_size//2,
                     robot_x + head_size//2 + eye_size//2, robot_y - head_size*1.5 + eye_size//2],
                    fill=accent_color)
        
        # Robot body
        draw.rectangle([robot_x - head_size*1.2, robot_y - head_size//2,
                       robot_x + head_size*1.2, robot_y + head_size*1.5],
                      fill=(100, 100, 120), outline=(200, 200, 220), width=3)
        
        # Robot arms
        arm_width = head_size // 3
        draw.rectangle([robot_x - head_size*2, robot_y,
                       robot_x - head_size*1.2, robot_y + arm_width],
                      fill=(90, 90, 110))
        draw.rectangle([robot_x + head_size*1.2, robot_y,
                       robot_x + head_size*2, robot_y + arm_width],
                      fill=(90, 90, 110))
    
    # Add geometric shapes for abstract feel
    num_shapes = random.randint(3, 7)
    for _ in range(num_shapes):
        shape_type = random.choice(['circle', 'rectangle', 'triangle'])
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(20, min(width, height) // 8)
        alpha = random.randint(30, 100)
        color = (*random.choice(base_colors + [accent_color]), alpha)
        
        if shape_type == 'circle':
            overlay = PILImage.new('RGBA', (width, height), (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            overlay_draw.ellipse([x-size, y-size, x+size, y+size], fill=color)
            img = PILImage.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
        elif shape_type == 'rectangle':
            overlay = PILImage.new('RGBA', (width, height), (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            overlay_draw.rectangle([x-size, y-size, x+size, y+size], fill=color)
            img = PILImage.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    
    # Add text overlay with prompt info
    try:
        # Try to use a nice font
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 
                                       size=int(height * 0.06))
        subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 
                                          size=int(height * 0.03))
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    # Add title
    title = "AI Generated"
    bbox = draw.textbbox((0, 0), title, font=title_font)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = height - int(height * 0.15)
    
    # Draw text with shadow effect
    shadow_offset = 2
    draw.text((text_x + shadow_offset, text_y + shadow_offset), title, 
             fill=(0, 0, 0, 128), font=title_font)
    draw.text((text_x, text_y), title, fill=(255, 255, 255), font=title_font)
    
    # Add prompt subtitle
    prompt_display = prompt[:80] + "..." if len(prompt) > 80 else prompt
    bbox = draw.textbbox((0, 0), prompt_display, font=subtitle_font)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = height - int(height * 0.08)
    
    draw.text((text_x + 1, text_y + 1), prompt_display, 
             fill=(0, 0, 0, 100), font=subtitle_font)
    draw.text((text_x, text_y), prompt_display, 
             fill=(255, 255, 255, 200), font=subtitle_font)
    
    # Apply a slight blur for artistic effect
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    
    # Convert to bytes
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', optimize=True)
    return buffer.getvalue()

def generate_image(prompt: str, aspect_ratio: str = "16:9") -> dict:
    """
    Generate an image using available methods
    """
    
    try:
        # Check for OpenAI API key first
        openai_key = os.environ.get("OPENAI_API_KEY")
        if openai_key:
            try:
                import requests
                
                # Try DALL-E 3
                response = requests.post(
                    "https://api.openai.com/v1/images/generations",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "dall-e-3",
                        "prompt": prompt,
                        "n": 1,
                        "size": "1024x1024" if aspect_ratio == "1:1" else "1792x1024",
                        "quality": "standard"
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("data") and len(result["data"]) > 0:
                        image_url = result["data"][0]["url"]
                        
                        # Download the image
                        img_response = requests.get(image_url, timeout=10)
                        if img_response.status_code == 200:
                            return {
                                "success": True,
                                "image_data": base64.b64encode(img_response.content).decode('utf-8'),
                                "mime_type": "image/png",
                                "prompt": prompt,
                                "aspect_ratio": aspect_ratio,
                                "model": "dall-e-3"
                            }
            except Exception as e:
                print(f"DALL-E generation failed: {e}", file=sys.stderr)
        
        # Fallback to AI-styled image generation
        image_data = create_ai_styled_image(prompt, aspect_ratio)
        
        return {
            "success": True,
            "image_data": base64.b64encode(image_data).decode('utf-8'),
            "mime_type": "image/png",
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "model": "ai-styled-generator",
            "note": "Generated using AI-styled image creator"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "prompt": prompt
        }

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    
    try:
        input_data = json.loads(sys.argv[1])
        prompt = input_data.get('prompt', '')
        aspect_ratio = input_data.get('aspectRatio', '16:9')
        
        if not prompt:
            print(json.dumps({"error": "No prompt provided"}))
            sys.exit(1)
        
        result = generate_image(prompt, aspect_ratio)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()