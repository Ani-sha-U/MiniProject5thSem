from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from PIL import Image
import io
import base64

app = FastAPI()

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================================================
# SEGMENTATION ENDPOINT (simple MVP segmentation)
# ======================================================
@app.post("/segment")
async def segment(file: UploadFile = File(...)):
    try:
        content = await file.read()
        img = Image.open(io.BytesIO(content)).convert("RGBA")
        np_img = np.array(img)

        # Simple MVP segmentation:
        # Assume non-background pixels have some color variation.
        # (Not perfect, but works well for clean backgrounds.)
        gray = np.mean(np_img[..., :3], axis=2)
        mask = gray < 240  # threshold

        # Build output PNG with transparency
        out = np.zeros_like(np_img)
        out[..., :3] = np_img[..., :3]
        out[..., 3] = mask.astype(np.uint8) * 255  # alpha channel

        out_img = Image.fromarray(out)

        # Encode foreground
        buf = io.BytesIO()
        out_img.save(buf, format="PNG")
        fg_b64 = base64.b64encode(buf.getvalue()).decode()

        # Encode mask
        mask_img = Image.fromarray((mask * 255).astype(np.uint8))
        buf2 = io.BytesIO()
        mask_img.save(buf2, format="PNG")
        mask_b64 = base64.b64encode(buf2.getvalue()).decode()

        return {
            "foreground": fg_b64,
            "mask": mask_b64
        }

    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
