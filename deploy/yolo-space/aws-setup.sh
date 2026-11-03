#!/bin/bash
# Sets up the YOLO scanner on an Amazon Linux 2023 EC2 server.
# Run from the folder that holds Dockerfile, requirements.txt, main.py, best.pt:
#   bash aws-setup.sh
# Result: the scanner at https://<server-ip-with-dashes>.sslip.io (free HTTPS via Caddy)
set -e

echo "== Installing Docker =="
sudo dnf install -y docker
sudo systemctl enable --now docker

echo "== Building the scanner image (takes several minutes) =="
sudo docker build -t yolo .

echo "== Starting the scanner and the HTTPS proxy =="
sudo docker network create web 2>/dev/null || true
sudo docker rm -f yolo caddy 2>/dev/null || true

# Scanner: only reachable inside the server, restarts on crash or reboot
sudo docker run -d --name yolo --network web --restart always -e PORT=8080 yolo

# sslip.io turns the server's IP into a hostname, so Caddy can get a free certificate
IP=$(curl -s https://checkip.amazonaws.com)
HOST="$(echo "$IP" | tr . -).sslip.io"

sudo docker run -d --name caddy --network web --restart always \
  -p 80:80 -p 443:443 -v caddy_data:/data \
  caddy:2 caddy reverse-proxy --from "$HOST" --to yolo:8080

echo ""
echo "Done. Wait about 1 minute for the model to load, then open:"
echo "  https://$HOST/"
echo "Set this in config.ts:"
echo "  export const YOLO_URL = \"https://$HOST\";"
