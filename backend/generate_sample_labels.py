"""
Generate synthetic realistic Indian product packaging labels for demonstration and testing.
Creates:
  1. sample_labels/sample_1_compliant.png (Fully compliant with Rules 6, 7, 8)
  2. sample_labels/sample_2_missing_mrp.png (Violates Rule 6(1)(e))
  3. sample_labels/sample_3_missing_mfg_address.png (Violates Rule 6(1)(a))
  4. sample_labels/sample_4_missing_origin_import.png (Violates Rule 6(1)(g))
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "sample_labels")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_label(filename: str, title: str, fields: dict, bg_color=(248, 249, 250)):
    # Create canvas
    width, height = 700, 950
    image = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(image)

    # Borders & Header banner
    draw.rectangle([15, 15, width - 15, height - 15], outline=(30, 58, 95), width=4)
    draw.rectangle([20, 20, width - 20, 110], fill=(30, 58, 95))
    
    # Try loading default fonts
    try:
        font_large = ImageFont.truetype("arial.ttf", 26)
        font_header = ImageFont.truetype("arial.ttf", 22)
        font_sub = ImageFont.truetype("arial.ttf", 16)
        font_text = ImageFont.truetype("arial.ttf", 15)
        font_bold = ImageFont.truetype("arialbd.ttf", 15)
    except Exception:
        font_large = font_header = font_sub = font_text = font_bold = ImageFont.load_default()

    # Title Banner
    draw.text((width // 2, 50), title.upper(), fill=(255, 255, 255), font=font_large, anchor="mm")
    draw.text((width // 2, 85), "PRE-PACKAGED RETAIL COMMODITY", fill=(255, 153, 51), font=font_sub, anchor="mm")

    # Principal Display Panel boundary box
    draw.rectangle([35, 130, width - 35, height - 35], outline=(19, 136, 8), width=2)
    draw.rectangle([45, 140, 320, 170], fill=(19, 136, 8))
    draw.text((55, 145), "PRINCIPAL DISPLAY PANEL (PDP)", fill=(255, 255, 255), font=font_sub)

    y = 190
    line_spacing = 38

    for label, val in fields.items():
        if val is None:
            continue
            
        # Draw label
        draw.text((55, y), f"{label}:", fill=(40, 40, 40), font=font_bold)
        
        # Multiline wrap for longer text like address
        if len(str(val)) > 45:
            words = str(val).split(" ")
            line1 = " ".join(words[:6])
            line2 = " ".join(words[6:])
            draw.text((250, y), line1, fill=(20, 20, 20), font=font_text)
            y += 24
            draw.text((250, y), line2, fill=(20, 20, 20), font=font_text)
        else:
            draw.text((250, y), str(val), fill=(20, 20, 20), font=font_text)
            
        y += line_spacing

    # Footer note
    draw.line([(35, height - 80), (width - 35, height - 80)], fill=(200, 200, 200), width=1)
    draw.text(
        (width // 2, height - 55),
        "Compliant with Legal Metrology (Packaged Commodities) Rules, 2011",
        fill=(100, 100, 100),
        font=font_sub,
        anchor="mm"
    )

    out_path = os.path.join(OUTPUT_DIR, filename)
    image.save(out_path)
    print(f"Generated sample label: {out_path}")
    return out_path


def main():
    # 1. Compliant Label
    create_label(
        "sample_1_compliant.png",
        "HIMALAYAN PREMIUM ALMONDS",
        {
            "Generic / Common Name": "Roasted California Almonds",
            "Net Quantity": "500 g",
            "Maximum Retail Price (MRP)": "MRP Rs. 499.00 (inclusive of all taxes)",
            "Unit Sale Price (USP)": "Rs. 0.998 per g",
            "Month & Year of Pkg": "11 / 2024",
            "Expiry / Best Before": "10 / 2025",
            "Batch / Lot No.": "BAT-2024-ND-889",
            "Manufacturer & Packer": "Himalayan Agro Foods Pvt. Ltd., Plot 14, Okhla Phase-III, New Delhi 110020",
            "Customer Care Email": "support@himalayanfoods.in",
            "Customer Care Phone": "+91-11-26894455",
            "Customer Care Address": "Manager, Consumer Redressal, Plot 14, Okhla Phase-III, New Delhi 110020",
            "Country of Origin": "India",
            "FSSAI License No.": "10019011005892"
        }
    )

    # 2. Missing MRP (Rule 6(1)(e) violation)
    create_label(
        "sample_2_missing_mrp.png",
        "GOLDEN HARVEST WHEAT ATTA",
        {
            "Generic / Common Name": "Whole Wheat Flour (Atta)",
            "Net Quantity": "5 kg",
            "Maximum Retail Price (MRP)": None,  # MISSING!
            "Unit Sale Price (USP)": "Rs. 45.00 per kg",
            "Month & Year of Mfg": "12 / 2024",
            "Manufacturer": "Bharat Milling Works, Industrial Area, Ludhiana 141003",
            "Customer Care Details": "care@bharatflour.com, 1800-180-2233",
            "Country of Origin": "India"
        }
    )

    # 3. Missing Manufacturer Address (Rule 6(1)(a) violation)
    create_label(
        "sample_3_missing_mfg_address.png",
        "ROYAL TASTE NAMKEEN",
        {
            "Generic / Common Name": "Spicy Bhujia Sev",
            "Net Quantity": "200 g",
            "Maximum Retail Price (MRP)": "MRP Rs. 40.00 (inclusive of all taxes)",
            "Unit Sale Price (USP)": "Rs. 0.20 per g",
            "Month & Year of Mfg": "01 / 2025",
            "Manufacturer": None,  # MISSING!
            "Customer Care Details": "feedback@royalsnacks.com, 022-44556677",
            "Country of Origin": "India"
        }
    )

    # 4. Imported Product Missing Country of Origin (Rule 6(1)(g) violation)
    create_label(
        "sample_4_missing_origin_import.png",
        "SWISS LUXURY CHOCOLATE BAR",
        {
            "Generic / Common Name": "Dark Milk Chocolate 70%",
            "Net Quantity": "100 g",
            "Maximum Retail Price (MRP)": "MRP Rs. 299.00 (inclusive of all taxes)",
            "Unit Sale Price (USP)": "Rs. 2.99 per g",
            "Month & Year of Import": "09 / 2024",
            "Importer": "Global Gourmet Imports Pvt Ltd, Nariman Point, Mumbai 400021",
            "Country of Origin": None,  # MISSING for imported goods!
            "Customer Care": "care@globalgourmet.in, 1800-22-9900"
        }
    )

if __name__ == "__main__":
    main()
