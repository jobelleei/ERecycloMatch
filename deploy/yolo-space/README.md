---
title: ERecycloMatch YOLO
emoji: ♻️
colorFrom: green
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

YOLO e-waste detection API for ERecycloMatch.

- `GET /` health check
- `POST /detect` (multipart field `file`) returns `{ success, label, confidence, ... }`

Before uploading, copy into this folder:
- `backend/main.py`
- `backend/runs/detect/train-14/weights/best.pt`
