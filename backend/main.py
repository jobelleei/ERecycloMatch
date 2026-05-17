from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from PIL import Image
import io
import mysql.connector
import os
import shutil
import easyocr
import re

app = FastAPI()

reader = easyocr.Reader(['en'])

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# MYSQL CONNECTION
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="capstone_db"
)

cursor = conn.cursor(dictionary=True)

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

# APPROVED ITEMS API newly added block of codes

# PENDING ITEMS API
# PENDING ITEMS API
@app.get("/pending-items/{submitter_name}")
def get_pending_items(submitter_name: str):

    query = """
    SELECT *
    FROM pending_items
    WHERE LOWER(submitter_name) = LOWER(%s)
    """

    cursor.execute(query, (submitter_name,))
    items = cursor.fetchall()

    return items


# APPROVED ITEMS API
@app.get("/approved-items/{submitter_name}")
def get_approved_items(submitter_name: str):

    query = """
    SELECT *
    FROM approved_items
    WHERE LOWER(submitter_name) = LOWER(%s)
    """

    cursor.execute(query, (submitter_name,))
    items = cursor.fetchall()

    return items


# REJECTED ITEMS API
@app.get("/rejected-items/{submitter_name}")
def get_rejected_items(submitter_name: str):

    query = """
    SELECT *
    FROM rejected_items
    WHERE LOWER(submitter_name) = LOWER(%s)
    """

    cursor.execute(query, (submitter_name,))
    items = cursor.fetchall()

    return items

# DELETE ITEM API
@app.delete("/delete-item/{item_id}")
def delete_item(item_id: int):

    query = "DELETE FROM pending_items WHERE id = %s"

    cursor.execute(query, (item_id,))
    conn.commit()

    return {"message": "Item deleted successfully"}

@app.post("/verify-id")
async def verify_id(
    file: UploadFile = File(...),
    name: str = Form(...)
):

    try:

        contents = await file.read()

        temp_path = "temp_id.jpg"

        with open(temp_path, "wb") as f:
            f.write(contents)

        results = reader.readtext(temp_path)

        extracted_text = " ".join(
            [r[1] for r in results]
        ).upper()

        signup_name = name.upper()

        clean_signup_name = re.sub(
            r'[^A-Z ]',
            '',
            signup_name
        )

        name_match = (
            clean_signup_name
            in extracted_text
        )

        valid_keywords = [
            "REPUBLIC OF THE PHILIPPINES",
            "PHILSYS",
            "DRIVER",
            "LICENSE",
            "PASSPORT",
            "POSTAL",
            "VOTER",
            "UMID",
            "STUDENT",
            "TIN",
            "PRC",
        ]

        valid_id = any(
            keyword in extracted_text
            for keyword in valid_keywords
        )

        return {
            "success": True,
            "valid_id": valid_id,
            "name_match": name_match,
            "extracted_text": extracted_text
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }
    
@app.post("/individual_signup")
async def individual_signup(
    fullname: str = Form(...),
    email: str = Form(...),
    password: str = Form(...)
):
    try:
        query = """
        INSERT INTO users (fullname, email, password)
        VALUES (%s, %s, %s)
        """

        cursor.execute(
            query,
            (fullname, email, password)
        )

        conn.commit()

        return {
            "success": True,
            "message": "Signup successful"
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }