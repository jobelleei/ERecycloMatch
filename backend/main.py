from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import io
import mysql.connector

# MYSQL CONNECTION
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="capstone_db"
)

cursor = conn.cursor(dictionary=True)

app = FastAPI()

model = YOLO("runs/detect/train-4/weights/best.pt")
print("MODEL LOADED:", model.ckpt_path)

@app.get("/")
def home():
    return {"message": "YOLO Backend Running"}

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

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

# APPROVED ITEMS API
@app.get("/approved-items/{user_id}")
def get_approved_items(user_id: int):

    query = """
    SELECT *
    FROM approved_items
    WHERE user_id = %s
    """

    cursor.execute(query, (user_id,))
    items = cursor.fetchall()

    return items

@app.get("/rejected-items/{user_id}")
def get_rejected_items(user_id: int):

    query = """
    SELECT *
    FROM rejected_items
    WHERE user_id = %s
    """

    cursor.execute(query, (user_id,))
    items = cursor.fetchall()

    return items