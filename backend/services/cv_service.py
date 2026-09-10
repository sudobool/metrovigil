import cv2
import numpy as np
import pytesseract

def detect_pdp_area(image_path: str) -> dict:
    try:
        image = cv2.imread(image_path)
        if image is None:
            return {}
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 50, 150)
        
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return {}
            
        largest_contour = max(contours, key=cv2.contourArea)
        area_pixels = cv2.contourArea(largest_contour)
        
        # Very rough heuristic to map pixels to cm2. Assuming typical image sizes.
        # This would normally require reference objects or specific DPI info.
        pixel_to_cm2_factor = 0.005 
        area_cm2 = area_pixels * pixel_to_cm2_factor
        
        return {
            "pdp_area_pixels": int(area_pixels),
            "pdp_area_cm2": float(area_cm2),
            "shape": classify_package_shape_contour(largest_contour),
            "contour": largest_contour.tolist() if isinstance(largest_contour, np.ndarray) else []
        }
    except Exception as e:
        print(f"CV error in detect_pdp_area: {e}")
        return {}

def classify_package_shape_contour(contour) -> str:
    # Simplified classification
    x, y, w, h = cv2.boundingRect(contour)
    aspect_ratio = float(w)/h
    
    # Check if roughly circular/cylindrical
    area = cv2.contourArea(contour)
    hull = cv2.convexHull(contour)
    hull_area = cv2.contourArea(hull)
    solidity = float(area)/hull_area if hull_area > 0 else 0
    
    if solidity > 0.9 and 0.8 <= aspect_ratio <= 1.2:
        return "cylindrical"  # might be top down view, etc.
    elif solidity > 0.8:
        return "rectangular"
    return "irregular"

def classify_package_shape(image_path: str) -> str:
    try:
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edged = cv2.Canny(gray, 50, 150)
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return "unknown"
            
        largest_contour = max(contours, key=cv2.contourArea)
        return classify_package_shape_contour(largest_contour)
    except Exception:
        return "unknown"

def estimate_font_height(image_path: str) -> dict:
    try:
        image = cv2.imread(image_path)
        if image is None:
            return {}
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # First attempt: pytesseract if available
        try:
            d = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
            heights = []
            n_boxes = len(d['text'])
            for i in range(n_boxes):
                if int(d['conf'][i]) > 60:
                    text = d['text'][i].strip()
                    if text:
                        heights.append(d['height'][i])
            if heights:
                avg_height = np.mean(heights)
                pixel_to_mm = 0.0846
                return {
                    "avg_height_pixels": float(avg_height),
                    "estimated_height_mm": float(round(avg_height * pixel_to_mm, 2)),
                    "min_height_pixels": float(np.min(heights))
                }
        except Exception:
            pass

        # Second attempt: Pure OpenCV contour detection for text characters
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
        contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        char_heights = []
        img_h, img_w = gray.shape[:2]
        for c in contours:
            x, y, w, h = cv2.boundingRect(c)
            # Filter typical character aspect ratios and reasonable sizes
            if 8 < h < (img_h * 0.25) and 4 < w < (img_w * 0.4) and 0.2 < (w / h) < 3.5:
                char_heights.append(h)
                
        if char_heights:
            avg_h = float(np.median(char_heights))
            pixel_to_mm = 0.0846
            return {
                "avg_height_pixels": avg_h,
                "estimated_height_mm": float(round(avg_h * pixel_to_mm, 2)),
                "min_height_pixels": float(np.min(char_heights))
            }
            
        return {}
    except Exception as e:
        print(f"CV error in estimate_font_height: {e}")
        return {}

