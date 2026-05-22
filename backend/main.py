from cProfile import label

from fastapi import FastAPI, UploadFile, File, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import mysql.connector
from ultralytics import YOLO
import shutil
import os
import uuid
import asyncio

app = FastAPI()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MYSQL
db = mysql.connector.connect(
    unix_socket="/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock",
    user="root",
    password="",
    database="capstone_db"
)

# YOLO MODEL
model = YOLO("runs/detect/train-4/weights/best.pt")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# REALTIME CONNECTIONS
active_connections = []


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)

    print("Client connected")

    try:
        while True:
            await websocket.receive_text()

    except Exception:
        if websocket in active_connections:
            active_connections.remove(websocket)

        print("Client disconnected")


async def send_notification(data):
    disconnected = []

    for connection in active_connections:
        try:
            await connection.send_json(data)

        except Exception:
            disconnected.append(connection)

    for connection in disconnected:
        if connection in active_connections:
            active_connections.remove(connection)


# YOLO DETECT API
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


# MATCH FACILITY API
@app.get("/match-facility/{label}")
async def match_facility(
    label: str,
    description: str = ""
):
    try:
        cursor = db.cursor(
            dictionary=True
        )

        # GET ALL ACTIVE FACILITY POSTS
        cursor.execute("""
            SELECT
                fp.*,
                af.profile_image,
                af.name
                    AS facility_name,
                af.location
                    AS facility_location
            FROM
                facility_postings fp
            LEFT JOIN
                approved_facilities af
            ON
                fp.facility_id = af.id
            WHERE
                fp.status = 'Posted'
        """)

        facilities = cursor.fetchall()

        matches = []

        label_clean = (
            label.strip()
            .lower()
        )

        description_clean = (
            description.strip()
            .lower()
        )

        for facility in facilities:

            item_needed = (
                facility.get(
                    "item_needed",
                    ""
                )
                .strip()
                .lower()
            )

            # =================
            # PRIORITY 1:
            # LABEL MATCH
            # CASE INSENSITIVE
            # =================
            if (
                label_clean !=
                "unknown"
                and
                label_clean ==
                item_needed
            ):
                matches.append(
                    facility
                )
                continue

            # =================
            # PRIORITY 2:
            # UNKNOWN ITEM
            # USE DESCRIPTION
            # =================
            if (
                label_clean ==
                "unknown"
                and
                item_needed
                and
                item_needed in
                description_clean
            ):
                matches.append(
                    facility
                )

        # REALTIME MATCH
        if matches:

            facility = matches[0]

            await send_notification({
                "type":
                    "match_found",

                "facility_id":
                    facility[
                        "facility_id"
                    ],

                "facility_name":
                    facility[
                        "facility_name"
                    ],

                "facility_location":
                    facility[
                        "facility_location"
                    ],

                "profile_image":
                    facility[
                        "profile_image"
                    ]
            })

        cursor.close()

        return {
            "success": True,
            "matches": matches
        }

    except Exception as e:

        return {
            "success": False,
            "message":
                str(e)
        }


# FACILITY REALTIME UPDATE
@app.get("/facility-updated")
async def facility_updated():
    await send_notification({
        "type": "facility_updated"
    })

    return {"success": True}


# HOME
@app.get("/")
def home():
    return {
        "message": "YOLO backend with realtime is running"
    }

