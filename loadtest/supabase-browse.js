import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate } from "k6/metrics";

const envFile = {};
for (const raw of open("../.env").split(/\r?\n/)) {
  const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) envFile[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = (__ENV.SUPABASE_URL || envFile.EXPO_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const ANON_KEY = __ENV.SUPABASE_KEY || envFile.EXPO_PUBLIC_SUPABASE_KEY;
const TEST_EMAIL = __ENV.TEST_EMAIL;
const TEST_PASSWORD = __ENV.TEST_PASSWORD;
const PROFILE = __ENV.PROFILE || "smoke";

const requestFailed = new Rate("request_failed");

const profiles = {
  smoke: { vus: 1, iterations: 2 },
  load: {
    stages: [
      { duration: "30s", target: 10 },
      { duration: "1m", target: 20 },
      { duration: "30s", target: 0 },
    ],
  },
  stress: {
    stages: [
      { duration: "30s", target: 20 },
      { duration: "1m", target: 40 },
      { duration: "1m", target: 60 },
      { duration: "30s", target: 0 },
    ],
  },
};

export const options = {
  ...profiles[PROFILE],
  thresholds: {
    request_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1500"],
  },
};

export function setup() {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error("Supabase URL/key not found. Check the .env file in the project root.");
  }
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error("Pass a test account: k6 run -e TEST_EMAIL=... -e TEST_PASSWORD=... supabase-browse.js");
  }

  const login = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { apikey: ANON_KEY, "Content-Type": "application/json" } },
  );
  if (login.status !== 200) {
    throw new Error(`Test account sign-in failed (HTTP ${login.status}): ${login.body}`);
  }
  const token = login.json("access_token");

  const prof = http.get(
    `${SUPABASE_URL}/rest/v1/profiles?select=id,role&email=eq.${encodeURIComponent(TEST_EMAIL)}`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } },
  );
  const rows = prof.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Signed in, but no profile row found for the test account.");
  }

  return { token, userId: String(rows[0].id) };
}

function get(path, headers, name) {
  const res = http.get(`${SUPABASE_URL}/rest/v1/${path}`, { headers, tags: { name } });
  const ok = check(res, { [`${name} 200`]: (r) => r.status === 200 });
  requestFailed.add(!ok);
  if (!ok && PROFILE === "smoke") {
    console.log(`${name} failed: HTTP ${res.status} ${res.body}`);
  }
  return res;
}

export default function (data) {
  const headers = { apikey: ANON_KEY, Authorization: `Bearer ${data.token}` };
  const uid = data.userId;

  group("home screen", () => {
    get(`items?select=*&user_id=eq.${uid}&order=updated_at.desc`, headers, "my items");
    get(`messages?select=conversation_id&receiver_id=eq.${uid}&is_read=eq.false`, headers, "unread messages");
  });
  sleep(1);

  group("facility list", () => {
    get(
      "profiles?select=id,name,role,status,address,location,profile_image,updated_at&role=ilike.facility&status=ilike.approved&order=name.asc",
      headers,
      "facility list",
    );
  });
  sleep(1);

  group("messages", () => {
    get(`conversations?select=*&user_id=eq.${uid}&order=updated_at.desc`, headers, "conversations");
  });
  sleep(1);

  group("notifications", () => {
    get(`notifications?select=*&profile_id=eq.${uid}&order=created_at.desc`, headers, "notifications");
  });
  sleep(2);
}
