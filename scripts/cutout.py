"""Cuts the model out of a photo (transparent background).
   python scripts/cutout.py public/art/tile-best.webp public/art/cut-anarkali.webp [model]
Needs:  pip install rembg onnxruntime pooch scipy scikit-image opencv-python-headless pymatting
The first run downloads the segmentation model (~170 MB) once."""
import sys
from PIL import Image
from rembg import new_session, remove

src, dst = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "isnet-general-use"
session = new_session(model)
img = Image.open(src).convert("RGB")
out = remove(img, session=session, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=15, alpha_matting_erode_size=6)
bbox = out.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
if bbox:
    pad = 8
    out = out.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(out.width, bbox[2] + pad), min(out.height, bbox[3] + pad)))
out.save(dst, "WEBP", quality=90, method=6)
print("saved", dst, out.size)
