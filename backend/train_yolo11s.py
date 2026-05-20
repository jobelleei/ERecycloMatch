from ultralytics import YOLO

model = YOLO("runs/detect/train-14/weights/last.pt")

model.train(resume=True)