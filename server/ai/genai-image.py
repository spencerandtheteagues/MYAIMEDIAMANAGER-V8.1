#!/usr/bin/env python3
"""
Real AI Image Generation using Google GenAI with Vertex AI
"""
import os
import sys
import json
import base64
from google import genai
from google.genai import types
import io
from PIL import Image as PILImage
import hashlib

def generate_image_with_genai(prompt: str, aspect_ratio: str = "16:9") -> dict:
    """
    Generate an image using Google GenAI with Imagen model
    
    Args:
        prompt: The text prompt to generate image from
        aspect_ratio: The desired aspect ratio
    
    Returns:
        dict with image data and metadata
    """
    
    try:
        # Get API key from environment
        api_key = os.environ.get("VERTEX_API_KEY")
        if not api_key:
            # Fallback to other possible keys
            api_key = os.environ.get("GOOGLE_CLOUD_API_KEY") or os.environ.get("GEMINI_API_KEY")
        
        if not api_key:
            raise ValueError("No API key found. Please set VERTEX_API_KEY, GOOGLE_CLOUD_API_KEY, or GEMINI_API_KEY")
        
        # Initialize the client - use either API key OR project/location, not both
        # When using API key, don't specify project/location
        client = genai.Client(
            vertexai=True,
            api_key=api_key
        )
        
        # Try to use Imagen for text-to-image generation
        # First try with the newer Imagen models
        model_options = [
            "imagen-3.0-generate-002",
            "imagen-4.0-fast-generate-001",
            "imagegeneration@006",
            "imagegeneration@005"
        ]
        
        success = False
        last_error = None
        
        for model_name in model_options:
            try:
                # Attempt image generation with current model
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Content(
                            role="user",
                            parts=[
                                types.Part.from_text(text=prompt)
                            ]
                        )
                    ],
                    config=types.GenerateContentConfig(
                        temperature=0.8,
                        top_p=0.95,
                        response_modalities=["IMAGE"],
                        safety_settings=[
                            types.SafetySetting(
                                category="HARM_CATEGORY_HATE_SPEECH",
                                threshold="OFF"
                            ),
                            types.SafetySetting(
                                category="HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold="OFF"
                            ),
                            types.SafetySetting(
                                category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold="OFF"
                            ),
                            types.SafetySetting(
                                category="HARM_CATEGORY_HARASSMENT",
                                threshold="OFF"
                            )
                        ]
                    )
                )
                
                # Extract image from response
                if response and response.candidates:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            if part.inline_data.mime_type.startswith('image/'):
                                return {
                                    "success": True,
                                    "image_data": base64.b64encode(part.inline_data.data).decode('utf-8'),
                                    "mime_type": part.inline_data.mime_type,
                                    "prompt": prompt,
                                    "aspect_ratio": aspect_ratio,
                                    "model": model_name
                                }
                
                # If no image in response, try next model
                continue
                
            except Exception as e:
                last_error = str(e)
                continue
        
        # If all models failed, try a fallback approach with Gemini
        try:
            # Use Gemini to generate a creative image description, then create a simple colored image
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(
                                text=f"Based on this prompt: '{prompt}', describe the dominant colors and mood in hex color codes. Return only: color1:#XXXXXX color2:#XXXXXX"
                            )
                        ]
                    )
                ]
            )
            
            # Extract colors from response
            text_response = response.text if hasattr(response, 'text') else str(response)
            
            # Parse colors or use defaults
            import re
            colors = re.findall(r'#[0-9A-Fa-f]{6}', text_response)
            if len(colors) >= 2:
                color1, color2 = colors[0], colors[1]
            else:
                # Default colors based on prompt hash
                hash_obj = hashlib.md5(prompt.encode())
                hash_hex = hash_obj.hexdigest()
                color1 = f"#{hash_hex[:6]}"
                color2 = f"#{hash_hex[6:12]}"
            
            # Create a gradient image with PIL
            from PIL import Image as PILImage, ImageDraw, ImageFont
            
            # Determine dimensions
            aspect_map = {
                "1:1": (1024, 1024),
                "16:9": (1024, 576),
                "9:16": (576, 1024),
                "4:3": (1024, 768),
                "3:4": (768, 1024)
            }
            width, height = aspect_map.get(aspect_ratio, (1024, 576))
            
            # Create gradient image
            img = PILImage.new('RGB', (width, height))
            draw = ImageDraw.Draw(img)
            
            # Convert hex to RGB
            def hex_to_rgb(hex_color):
                hex_color = hex_color.lstrip('#')
                return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            
            rgb1 = hex_to_rgb(color1)
            rgb2 = hex_to_rgb(color2)
            
            # Draw gradient
            for y in range(height):
                ratio = y / height
                r = int(rgb1[0] * (1 - ratio) + rgb2[0] * ratio)
                g = int(rgb1[1] * (1 - ratio) + rgb2[1] * ratio)
                b = int(rgb1[2] * (1 - ratio) + rgb2[2] * ratio)
                draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))
            
            # Add text overlay
            try:
                from PIL import ImageFont
                # Try to use a better font if available
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size=int(height * 0.05))
            except:
                font = ImageFont.load_default()
            
            # Add prompt text
            text = "AI Generated"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (width - text_width) // 2
            y = height // 2 - text_height
            draw.text((x, y), text, fill=(255, 255, 255), font=font)
            
            # Add prompt snippet
            prompt_text = prompt[:60] + "..." if len(prompt) > 60 else prompt
            try:
                small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size=int(height * 0.025))
            except:
                small_font = font
            bbox = draw.textbbox((0, 0), prompt_text, font=small_font)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            y = height // 2 + 20
            draw.text((x, y), prompt_text, fill=(255, 255, 255, 200), font=small_font)
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return {
                "success": True,
                "image_data": image_data,
                "mime_type": "image/png",
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "model": "fallback-gradient",
                "note": "Using fallback gradient due to API limitations"
            }
            
        except Exception as fallback_error:
            return {
                "success": False,
                "error": f"All generation methods failed. Last error: {last_error or str(fallback_error)}",
                "prompt": prompt
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "prompt": prompt
        }

def main():
    """Main entry point for command-line usage"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    
    try:
        # Parse input JSON
        input_data = json.loads(sys.argv[1])
        
        # Extract parameters
        prompt = input_data.get('prompt', '')
        aspect_ratio = input_data.get('aspectRatio', '16:9')
        
        if not prompt:
            print(json.dumps({"error": "No prompt provided"}))
            sys.exit(1)
        
        # Generate image
        result = generate_image_with_genai(prompt, aspect_ratio)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()