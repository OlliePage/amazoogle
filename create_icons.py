#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os
import sys

# Amazon orange color
amazon_orange = (255, 153, 0)  # #FF9900

# Create directory if it doesn't exist
os.makedirs('/Users/ollie/Developer/extensions/amazoogle', exist_ok=True)

# Function to create icon
def create_icon(size, output_path):
    # Create a white background image
    img = Image.new('RGB', (size, size), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Calculate font size based on image size (approximately 70% of image size)
    font_size = int(size * 0.7)
    
    # Try to use a system font, falling back as needed
    font = None
    try:
        # macOS system fonts
        potential_fonts = [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/Library/Fonts/Arial.ttf",
            "/System/Library/Fonts/SFNS.ttf"  # San Francisco font
        ]
        
        for font_path in potential_fonts:
            if os.path.exists(font_path):
                font = ImageFont.truetype(font_path, font_size)
                break
    except Exception as e:
        print(f"Font error: {e}")
    
    # If no font was loaded, use default
    if font is None:
        print("Using default font")
        font = ImageFont.load_default()
    
    # Draw 'A' in the center
    text = "A"
    
    # Different ways to get text dimensions based on PIL version
    try:
        # Newer Pillow versions
        left, top, right, bottom = font.getbbox(text)
        text_width, text_height = right - left, bottom - top
    except AttributeError:
        try:
            # Older Pillow versions
            text_width, text_height = draw.textsize(text, font=font)
        except AttributeError:
            # Really old versions or fallback
            text_width, text_height = font.getsize(text)
    
    position = ((size - text_width) // 2, (size - text_height) // 2)
    
    # Draw the text
    draw.text(position, text, fill=amazon_orange, font=font)
    
    # Save the image
    img.save(output_path)
    print(f"Created {output_path}")

# Create icons
create_icon(24, '/Users/ollie/Developer/extensions/amazoogle/icon24.png')
create_icon(48, '/Users/ollie/Developer/extensions/amazoogle/icon48.png')
create_icon(128, '/Users/ollie/Developer/extensions/amazoogle/icon128.png')