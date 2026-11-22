from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import numpy as np
import os
import shutil
import threading
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

MODEL_PATH = os.environ.get("MODEL_PATH", "runs/detect/train-14/weights/best.pt")

print("Loading YOLO model...")
model = YOLO(MODEL_PATH)
print("YOLO model loaded successfully.")

model.predict(
    source=np.zeros((416, 416, 3), dtype=np.uint8),
    imgsz=416,
    device="cpu",
    verbose=False,
)
print("YOLO model warmed up.")

predict_lock = threading.Lock()

MIN_CONFIDENCE = float(os.environ.get("MIN_CONFIDENCE", "0.60"))

RAW_CONFIDENCE = 0.25

ASK_TO_CONFIRM = os.environ.get("ASK_TO_CONFIRM", "false").lower() == "true"
GUESS_MIN_CONFIDENCE = float(os.environ.get("GUESS_MIN_CONFIDENCE", "0.30"))

_excluded = {
    name.strip().lower()
    for name in os.environ.get("EXCLUDE_CLASSES", "").split(",")
    if name.strip()
}
EWASTE_CLASSES = {
    name for name in model.names.values() if name.lower() not in _excluded
}

CONFIDENCE_WEIGHT = 0.7
CENTER_WEIGHT = 0.3
_MAX_CENTER_DISTANCE = (0.5 ** 2 + 0.5 ** 2) ** 0.5


def center_closeness(box):
    """1.0 = box centred in the photo, 0.0 = centred in a corner."""
    x1, y1, x2, y2 = box
    cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
    distance = ((cx - 0.5) ** 2 + (cy - 0.5) ** 2) ** 0.5
    return max(0.0, 1.0 - distance / _MAX_CENTER_DISTANCE)


def pick_primary(results):
    """
    Returns (primary, detections, best_raw_confidence, guess).
    detections: e-waste boxes at or above MIN_CONFIDENCE, primary first.
    Boxes are [x1, y1, x2, y2] as fractions of the photo's width and height.
    """
    candidates = []
    best_raw = 0.0

    if results and len(results) > 0 and results[0].boxes is not None:
        boxes = results[0].boxes
        for i in range(len(boxes)):
            label = model.names[int(boxes.cls[i])]
            confidence = float(boxes.conf[i])

            if label not in EWASTE_CLASSES:
                continue

            best_raw = max(best_raw, confidence)

            box = [round(float(v), 4) for v in boxes.xyxyn[i].tolist()]
            score = CONFIDENCE_WEIGHT * confidence + CENTER_WEIGHT * center_closeness(box)
            candidates.append({
                "label": label,
                "confidence": confidence,
                "box": box,
                "score": round(score, 4),
            })

    candidates.sort(key=lambda d: d["score"], reverse=True)

    detections = [d for d in candidates if d["confidence"] >= MIN_CONFIDENCE]
    primary = detections[0] if detections else None

    guess = None
    if primary is None and ASK_TO_CONFIRM:
        unsure = [d for d in candidates if d["confidence"] >= GUESS_MIN_CONFIDENCE]
        guess = unsure[0] if unsure else None

    return primary, detections, best_raw, guess


@app.get("/")
def home():
    return {
        "success": True,
        "message": "YOLO backend is running",
        "model_path": MODEL_PATH,
    }


@app.post("/detect")
def detect(file: UploadFile = File(...)):
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

        with predict_lock:
            results = model.predict(
                source=file_path,
                imgsz=416,
                conf=RAW_CONFIDENCE,
                device="cpu",
                verbose=False,
                max_det=10,
            )

        predict_time = round(time.time() - predict_start, 2)

        primary, detections, best_raw, guess = pick_primary(results)

        total_time = round(time.time() - start_time, 2)

        print("YOLO RESULT:", {
            "label": primary["label"] if primary else "Unknown",
            "confidence": primary["confidence"] if primary else best_raw,
            "kept": len(detections),
            "predict_time": predict_time,
            "total_time": total_time,
        })

        return {
            "success": True,
            "label": primary["label"] if primary else "Unknown",
            "confidence": primary["confidence"] if primary else best_raw,
            "box": primary["box"] if primary else None,
            "detections": detections,
            "guess": guess,
            "min_confidence": MIN_CONFIDENCE,
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
def predict(file: UploadFile = File(...)):
    return detect(file)