from ultralytics import YOLO

# Load your trained model
model = YOLO("runs/detect/train-3/weights/best.pt")

# Validate the model
metrics = model.val()

# Display metrics
print("Precision:", metrics.box.mp)
print("Recall:", metrics.box.mr)
print("mAP50:", metrics.box.map50)
print("mAP50-95:", metrics.box.map)