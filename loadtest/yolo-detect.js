import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const BASE_URL = __ENV.YOLO_URL || "https://52-63-27-183.sslip.io";
const PROFILE = __ENV.PROFILE || "smoke";

const photo = open("../assets/images/samsung.jpg", "b");

const detectTime = new Trend("detect_time", true);
const detectFailed = new Rate("detect_failed");

const profiles = {
  smoke: {
    vus: 1,
    iterations: 3,
  },
  load: {
    stages: [
      { duration: "30s", target: 5 },
      { duration: "1m", target: 10 },
      { duration: "30s", target: 0 },
    ],
  },
  stress: {
    stages: [
      { duration: "30s", target: 10 },
      { duration: "1m", target: 20 },
      { duration: "1m", target: 30 },
      { duration: "30s", target: 0 },
    ],
  },
};

export const options = {
  ...profiles[PROFILE],
  thresholds: {
    detect_failed: ["rate<0.05"],
    detect_time: ["p(95)<10000"],
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/detect`,
    { file: http.file(photo, "samsung.jpg", "image/jpeg") },
    { timeout: "60s" },
  );

  let body = null;
  try {
    body = res.json();
  } catch (e) {
    body = null;
  }

  const ok = check(res, {
    "status is 200": (r) => r.status === 200,
    "server says success": () => body !== null && body.success === true,
    "has a label": () => body !== null && typeof body.label === "string",
  });

  detectTime.add(res.timings.duration);
  detectFailed.add(!ok);

  if (PROFILE === "smoke" && body) {
    console.log(`label=${body.label} confidence=${body.confidence} time=${res.timings.duration}ms`);
  }

  sleep(1);
}
