from fastapi import FastAPI, UploadFile, File, Form
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import mysql.connector
from ultralytics import YOLO
import shutil
import easyocr
import re

app = FastAPI()

reader = easyocr.Reader(['en'])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = mysql.connector.connect(
    unix_socket="/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock",
    user="root",
    password="",
    database="capstone_db"
)

# IMPORTANT: use your trained model
model = YOLO("runs/detect/train-4/weights/best.pt")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    try:
        file_extension = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = model(file_path, conf=0.10)

        detections = []

        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                label = model.names[class_id]

                detections.append({
                    "label": label,
                    "confidence": confidence
                })

        if len(detections) == 0:
            return {
                "message": "object not found",
                "label": "Unknown",
                "detections": []
            }

        detections = sorted(
            detections,
            key=lambda item: item["confidence"],
            reverse=True
        )

        return {
            "message": "object detected",
            "label": detections[0]["label"],
            "confidence": detections[0]["confidence"],
            "detections": detections
        }

    except Exception as e:
        return {
            "message": "scan error",
            "label": "Unknown",
            "error": str(e),
            "detections": []
        }


@app.get("/my-items/{submitter_name}")
def get_my_items(submitter_name: str):
    cursor = db.cursor(dictionary=True)

    pending_query = """
        SELECT 
            id,
            submitter_name,
            item_name,
            description,
            issues,
            hazard_status,
            recyclability,
            item_image,
            created_at,
            'Pending' AS status
        FROM pending_items
        WHERE TRIM(submitter_name) = TRIM(%s)
    """

    approved_query = """
        SELECT 
            id,
            submitter_name,
            item_name,
            description,
            issues,
            hazard_status,
            recyclability,
            item_image,
            created_at,
            'Listed' AS status
        FROM approved_items
        WHERE TRIM(submitter_name) = TRIM(%s)
    """

    rejected_query = """
        SELECT 
            id,
            submitter_name,
            item_name,
            description,
            issues,
            hazard_status,
            recyclability,
            item_image,
            created_at,
            'Rejected' AS status
        FROM rejected_items
        WHERE TRIM(submitter_name) = TRIM(%s)
    """

    cursor.execute(pending_query, (submitter_name,))
    pending_items = cursor.fetchall()

    cursor.execute(approved_query, (submitter_name,))
    approved_items = cursor.fetchall()

    cursor.execute(rejected_query, (submitter_name,))
    rejected_items = cursor.fetchall()

    cursor.close()

    all_items = pending_items + approved_items + rejected_items

    return all_items


@app.delete("/delete-item/{status}/{item_id}")
def delete_item(status: str, item_id: int):
    cursor = db.cursor(dictionary=True)

    if status == "Pending":
        table_name = "pending_items"
    elif status == "Listed":
        table_name = "approved_items"
    elif status == "Rejected":
        table_name = "rejected_items"
    else:
        return {"message": "Invalid item status"}

    query = f"DELETE FROM {table_name} WHERE id = %s"

    cursor.execute(query, (item_id,))
    db.commit()
    cursor.close()

    return {"message": "Item deleted successfully"}


@app.get("/")
def home():
    return {"message": "YOLO backend is running"}