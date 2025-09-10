#!/usr/bin/env python3
"""
Real AI Image Generation using Google Imagen through Vertex AI
"""
import os
import sys
import json
import base64
import requests
from typing import Optional

def generate_image_with_imagen(prompt: str, aspect_ratio: str = "16:9") -> dict:
    """
    Generate an image using Google Imagen text-to-image model
    
    Args:
        prompt: The text prompt to generate image from
        aspect_ratio: The desired aspect ratio
    
    Returns:
        dict with image data and metadata
    """
    
    # Get API key from environment
    api_key = os.environ.get("VERTEX_API_KEY")
    if not api_key:
        raise ValueError("No API key found. Please set VERTEX_API_KEY")
    
    # Vertex AI endpoint for Imagen
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "replit-ai-project")
    location = os.environ.get("VERTEX_LOCATION", "us-central1")
    
    # Use the Imagen model for text-to-image generation
    model = "imagen-4.0-generate-001"
    endpoint = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/{model}:predict"
    
    # Configure the request
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Map aspect ratios to Imagen supported dimensions
    aspect_map = {
        "1:1": {"width": 1024, "height": 1024},
        "16:9": {"width": 1024, "height": 576},
        "9:16": {"width": 576, "height": 1024},
        "4:3": {"width": 1024, "height": 768},
        "3:4": {"width": 768, "height": 1024}
    }
    
    dimensions = aspect_map.get(aspect_ratio, aspect_map["16:9"])
    
    # Create the request payload for Imagen
    payload = {
        "instances": [{
            "prompt": prompt
        }],
        "parameters": {
            "sampleCount": 1,
            "width": dimensions["width"],
            "height": dimensions["height"],
            "guidanceScale": 7.5,
            "seed": None  # Random seed for variety
        }
    }
    
    try:
        # Make the API request
        response = requests.post(endpoint, headers=headers, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            
            # Extract the generated image
            if "predictions" in result and len(result["predictions"]) > 0:
                prediction = result["predictions"][0]
                
                # The image is returned as base64
                if "bytesBase64Encoded" in prediction:
                    image_data = prediction["bytesBase64Encoded"]
                    return {
                        "success": True,
                        "image_data": image_data,
                        "mime_type": "image/png",
                        "prompt": prompt,
                        "aspect_ratio": aspect_ratio,
                        "model": model
                    }
            
            return {
                "success": False,
                "error": "No image generated in response",
                "response": result
            }
            
        else:
            return {
                "success": False,
                "error": f"{response.status_code} {response.reason}",
                "details": response.text
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
        result = generate_image_with_imagen(prompt, aspect_ratio)
        
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