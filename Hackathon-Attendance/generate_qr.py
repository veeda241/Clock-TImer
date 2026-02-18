"""
Generate 75 QR Code images for Hackathon Attendance
Each QR code encodes "Team N" - scannable with any camera app
Output: QR_Codes/ folder with Team_01_QR.png through Team_75_QR.png
"""

import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

# Configuration
TOTAL_TEAMS = 75
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "QR_Codes")
QR_SIZE = 300  # QR code pixel size
CARD_PADDING = 20
LABEL_HEIGHT = 50

def generate_qr_codes():
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f">> Generating {TOTAL_TEAMS} QR Codes...")
    print(f"   Output folder: {OUTPUT_DIR}\n")
    
    for team_num in range(1, TOTAL_TEAMS + 1):
        # QR code content - what the camera will show when scanned
        qr_text = f"Team {team_num}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction
            box_size=10,
            border=4,
        )
        qr.add_data(qr_text)
        qr.make(fit=True)
        
        # Create QR image
        qr_img = qr.make_image(fill_color="#1a1a2e", back_color="white")
        qr_img = qr_img.resize((QR_SIZE, QR_SIZE), Image.LANCZOS)
        
        # Create card with label
        card_width = QR_SIZE + (CARD_PADDING * 2)
        card_height = QR_SIZE + (CARD_PADDING * 2) + LABEL_HEIGHT
        card = Image.new('RGB', (card_width, card_height), 'white')
        
        # Paste QR code
        card.paste(qr_img, (CARD_PADDING, CARD_PADDING))
        
        # Draw team label
        draw = ImageDraw.Draw(card)
        
        # Try to use a nice font, fall back to default
        try:
            font = ImageFont.truetype("arial.ttf", 28)
        except (IOError, OSError):
            try:
                font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 28)
            except (IOError, OSError):
                font = ImageFont.load_default()
        
        # Center the label text
        label = f"Team {team_num}"
        bbox = draw.textbbox((0, 0), label, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (card_width - text_width) // 2
        text_y = QR_SIZE + CARD_PADDING + 10
        
        draw.text((text_x, text_y), label, fill="#1a1a2e", font=font)
        
        # Add a subtle border
        draw.rectangle(
            [0, 0, card_width - 1, card_height - 1],
            outline="#cccccc",
            width=2
        )
        
        # Save the image
        filename = f"Team_{str(team_num).zfill(2)}_QR.png"
        filepath = os.path.join(OUTPUT_DIR, filename)
        card.save(filepath, 'PNG')
        
        # Progress
        bar_length = 30
        filled = int(bar_length * team_num / TOTAL_TEAMS)
        bar = "#" * filled + "-" * (bar_length - filled)
        print(f"\r  [{bar}] {team_num}/{TOTAL_TEAMS} - {filename}", end="", flush=True)
    
    print(f"\n\n>> Done! All {TOTAL_TEAMS} QR codes saved to:")
    print(f"   {OUTPUT_DIR}")
    print(f"\n>> Scan any QR code with your phone camera to see the team number!")

if __name__ == "__main__":
    generate_qr_codes()
