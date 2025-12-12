import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from fastapi import UploadFile

import mediapipe as mp


async def run_segmentation(file: UploadFile):
    """
    Full segmentation pipeline:
      1. Load uploaded image
      2. Run MediaPipe Selfie Segmentation
      3. Convert float mask → binary mask
      4. Compute bounding box
      5. Create transparent PNG cutout of person
      6. Return base64 PNGs + bbox + original dimensions
    """

    # =======================
    # Step 1 — Load image
    # =======================
    contents = await file.read()
    npimg = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Invalid image")

    height, width = image.shape[:2]

    # =======================
    # Step 2 — MediaPipe segmentation
    # =======================
    mp_selfie = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1)

    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    result = mp_selfie.process(rgb)

    mask_float = result.segmentation_mask
    if mask_float is None:
        raise ValueError("Segmentation mask not produced")

    # =======================
    # Step 3 — Convert mask → uint8
    # =======================
    mask_uint8 = (mask_float > 0.5).astype(np.uint8) * 255

    # Ensure mask is 8-bit single channel
    mask_uint8 = mask_uint8.astype(np.uint8)

    # =======================
    # Step 4 — Bounding box
    # =======================
    # cv2.boundingRect requires a binary image (0/255)
    contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if len(contours) == 0:
        # No person detected
        x, y, w, h = 0, 0, width, height
    else:
        cnt = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(cnt)

    # =======================
    # Step 5 — Create transparent cutout
    # =======================
    rgba = cv2.cvtColor(image, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = mask_uint8  # transparency mask

    # Encode foreground PNG
    pil_fg = Image.fromarray(rgba)
    buf_fg = BytesIO()
    pil_fg.save(buf_fg, format="PNG")
    foreground_b64 = base64.b64encode(buf_fg.getvalue()).decode("utf-8")

    # Encode mask PNG
    pil_mask = Image.fromarray(mask_uint8)
    buf_mask = BytesIO()
    pil_mask.save(buf_mask, format="PNG")
    mask_b64 = base64.b64encode(buf_mask.getvalue()).decode("utf-8")

    # =======================
    # Response
    # =======================
    return {
        "mask": mask_b64,
        "foreground": foreground_b64,
        "bbox": [int(x), int(y), int(w), int(h)],
        "width": int(width),
        "height": int(height)
    }
