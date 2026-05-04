from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI()

model = YOLO("yolo11m.pt")
print("MODEL LOADED:", model.ckpt_path)

@app.get("/")
def home():
    return {"message": "YOLO Backend Running"}

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    results = model(image)

    detections = []

    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            label = model.names[cls]
            conf = float(box.conf[0])

            detections.append({
                "label": label,
                "confidence": conf
            })

    return {"detections": detections}
