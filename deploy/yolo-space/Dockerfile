FROM python:3.11-slim

# OpenCV (used by ultralytics) needs these system libraries
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Run as a normal user; the app folder must be owned by it so
# main.py can create temp_uploads/ for incoming photos
RUN useradd -m -u 1000 user \
    && mkdir -p /home/user/app \
    && chown user:user /home/user/app
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    YOLO_CONFIG_DIR=/tmp/Ultralytics \
    MODEL_PATH=best.pt \
    PORT=7860 \
    WORKERS=2 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1

WORKDIR /home/user/app

# CPU-only PyTorch keeps the image small (no GPU needed)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=user main.py best.pt ./

EXPOSE 7860
# Cloud Run sets $PORT (8080); Hugging Face uses the 7860 default above
# WORKERS = photos scanned at the same time (one per CPU). OMP/MKL = 1 keeps
# the workers from competing for the same CPUs.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers ${WORKERS}"]
