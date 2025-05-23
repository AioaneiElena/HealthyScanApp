from fastapi import APIRouter, UploadFile, File, HTTPException
from pyzbar.pyzbar import decode
from PIL import Image
import numpy as np
import cv2
import io

router = APIRouter()

@router.post("/decode-barcode")
async def decode_barcode(file: UploadFile = File(...)):
    try:
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Convertim imaginea pentru OpenCV
        open_cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Decodăm codul de bare
        barcodes = decode(open_cv_image)

        if not barcodes:
            raise HTTPException(status_code=404, detail="Niciun cod de bare detectat.")

        barcode_data = barcodes[0].data.decode("utf-8")
        return {"code": barcode_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la decodare: {str(e)}")
