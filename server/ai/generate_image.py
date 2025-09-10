#!/usr/bin/env python3
"""
AI Image Generation using Google Gemini 2.5 Flash Image Preview
"""
import os
import sys
import json
import base64
from typing import Optional
from google import genai
from google.genai import types

def generate_image(prompt: str, aspect_ratio: str = "16:9", business_context: Optional[dict] = None) -> dict:
    """
    Generate an image using Gemini 2.5 Flash Image Preview model
    
    Args:
        prompt: The image generation prompt
        aspect_ratio: The desired aspect ratio (e.g., "16:9", "1:1", "9:16")
        business_context: Optional business context for enhanced prompts
    
    Returns:
        dict with image data and metadata
    """
    
    # Get API key from environment
    api_key = os.environ.get("GOOGLE_CLOUD_API_KEY") or os.environ.get("VERTEX_API_KEY")
    if not api_key:
        raise ValueError("No API key found. Please set GOOGLE_CLOUD_API_KEY or VERTEX_API_KEY")
    
    # Initialize client
    client = genai.Client(
        vertexai=True,
        api_key=api_key,
    )
    
    # Enhance prompt with business context if provided
    enhanced_prompt = prompt
    if business_context:
        business_name = business_context.get('businessName', '')
        product_name = business_context.get('productName', '')
        brand_tone = business_context.get('brandTone', '')
        
        if business_name or product_name:
            enhanced_prompt = f"{prompt}\n\nBrand: {business_name}"
            if product_name:
                enhanced_prompt += f", Product: {product_name}"
            if brand_tone:
                enhanced_prompt += f", Style: {brand_tone}"
    
    # Add text overlay instructions if needed
    if business_context and business_context.get('callToAction'):
        cta = business_context['callToAction']
        enhanced_prompt += f'\n\nInclude text overlay: "{cta}"'
    
    # Prepare the model and content
    model = "gemini-2.5-flash-image-preview"
    
    # Create content with image generation request
    text_part = types.Part.from_text(text=f"""Generate a high-quality image based on this description:

{enhanced_prompt}

Aspect Ratio: {aspect_ratio}
Style: Professional, modern, clean
Quality: High resolution, sharp details
Lighting: Well-lit, professional lighting

Create a visually appealing image that would work well for social media marketing.""")
    
    contents = [
        types.Content(
            role="user",
            parts=[text_part]
        )
    ]
    
    # Configure generation parameters
    generate_content_config = types.GenerateContentConfig(
        temperature=0.8,
        top_p=0.95,
        max_output_tokens=32768,
        response_modalities=["IMAGE", "TEXT"],
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
        ],
    )
    
    try:
        # Generate content
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )
        
        # Extract image data from response
        image_data = None
        description = ""
        
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                if part.inline_data.mime_type.startswith('image/'):
                    image_data = part.inline_data.data
            elif hasattr(part, 'text') and part.text:
                description = part.text
        
        if not image_data:
            raise ValueError("No image generated in response")
        
        return {
            "success": True,
            "image_data": base64.b64encode(image_data).decode('utf-8'),
            "mime_type": "image/png",
            "description": description,
            "prompt": enhanced_prompt,
            "aspect_ratio": aspect_ratio
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "prompt": enhanced_prompt
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
        business_context = input_data.get('businessContext', {})
        
        if not prompt:
            print(json.dumps({"error": "No prompt provided"}))
            sys.exit(1)
        
        # Generate image
        result = generate_image(prompt, aspect_ratio, business_context)
        
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