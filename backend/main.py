from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import os
import shutil
import uuid
import time
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "runs/detect/train-14/weights/best.pt"

print("Loading YOLO model...")
model = YOLO(MODEL_PATH)
print("YOLO model loaded successfully.")


@app.get("/")
def home():
    return {
        "success": True,
        "message": "YOLO backend is running",
        "model_path": MODEL_PATH,
    }


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    start_time = time.time()

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)

    file_extension = os.path.splitext(file.filename or "")[1] or ".jpg"
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(temp_dir, file_name)

    try:
        print("DETECT REQUEST RECEIVED")

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size_mb = round(os.path.getsize(file_path) / (1024 * 1024), 2)

        print("IMAGE SAVED:", {
            "file_path": file_path,
            "file_size_mb": file_size_mb,
        })

        predict_start = time.time()

        results = model.predict(
            source=file_path,
            imgsz=416,
            conf=0.25,
            device="cpu",
            verbose=False,
            max_det=1,
        )

        predict_time = round(time.time() - predict_start, 2)

        detected_label = "Unknown"
        confidence = 0.0

        if results and len(results) > 0:
            boxes = results[0].boxes

            if boxes is not None and len(boxes) > 0:
                best_box = boxes[0]
                class_id = int(best_box.cls[0])
                confidence = float(best_box.conf[0])
                detected_label = model.names[class_id]

        total_time = round(time.time() - start_time, 2)

        print("YOLO RESULT:", {
            "label": detected_label,
            "confidence": confidence,
            "predict_time": predict_time,
            "total_time": total_time,
        })

        return {
            "success": True,
            "label": detected_label,
            "confidence": confidence,
            "processing_time": predict_time,
            "total_time": total_time,
            "file_size_mb": file_size_mb,
        }

    except Exception as e:
        print("YOLO DETECT ERROR:", str(e))
        print(traceback.format_exc())

        return {
            "success": False,
            "message": str(e),
            "label": "Unknown",
            "confidence": 0,
            "processing_time": 0,
            "total_time": round(time.time() - start_time, 2),
        }

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    return await detect(file)