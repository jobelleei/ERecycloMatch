# ERecycloMatch

ERecycloMatch is an Android app that connects households with recycling facilities so electronic waste (e-waste) is disposed of responsibly. Users scan an item with their phone camera, the app identifies it, and they can then list it, find a facility that accepts it, and arrange the hand-over in chat.

## Features

**For households**
- **Scan an item.** Take a photo and the YOLO model identifies the e-waste item, drawing a box around what it detected and asking for confirmation when it is unsure.
- **My items and listings.** Save scanned items, describe their condition, and list them for facilities to request.
- **Find facilities.** Browse approved facilities on a list or a map (OpenStreetMap with satellite view), with distance and directions.
- **Chat and transactions.** Message a facility, send photos, accept or decline requests, and rate the other party when a transaction finishes.
- **Notifications.** Push notifications for new messages, requests, and transaction updates.

**For facilities**
- **Postings.** Publish what items the facility accepts.
- **Requests.** Browse household listings and request items.
- **Messages and history.** Chat with households and keep a record of completed recycling transactions.

**Accounts and safety**
- **Email verification.** Accounts are approved automatically once the email address is verified.
- **ID or document capture at sign-up.** Households photograph an ID and facilities upload a supporting document.
- **Reports.** Users can report a transaction; reported accounts are suspended from listing and transacting while an admin reviews them.
- **Offline notice.** A notice appears when the phone loses its internet connection.

## Tech stack

| Part | Technology |
|---|---|
| Mobile app | React Native with Expo (Expo Router), TypeScript |
| Backend | Supabase: Auth, Postgres, Storage, Realtime, Edge Functions |
| Item detection | YOLO11 model served by FastAPI, running in Docker on AWS EC2 |
| Maps | OpenStreetMap / Leaflet, MapTiler and Esri satellite imagery |
| Push notifications | Expo push service, triggered from Supabase |
| Scheduled jobs | GitHub Actions (daily inactive-user check) |

## Project structure

```
app/                  Screens (Expo Router file-based routing)
  user_dashboard/     Household screens: scan, items, listings, map, chat
  facility_dashboard/ Facility screens: postings, requests, map, chat
components/           Shared UI: bottom navigation, map view, tour, offline notice
utils/                Supabase client, chat helpers, geocoding, routing, suspension checks
services/             Push notification setup
supabase/             SQL scripts (triggers, realtime, demo data) and Edge Functions
deploy/yolo-space/    YOLO detection server: FastAPI app, Dockerfile, AWS setup script
backend/              Model training and validation scripts
scripts/              Node scripts used by the scheduled GitHub Action
loadtest/             k6 load tests for the detection server and Supabase
```

## Getting started

### Requirements
- Node.js 20 or later
- An Android phone or emulator
- The app uses native modules, so it runs in an Expo **development build**, not Expo Go

### 1. Install dependencies
```bash
npm install
```

### 2. Add your environment file
Create a `.env` file in the project root (it is ignored by git):
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_KEY=your-supabase-anon-key
```

### 3. Run the app
```bash
npx expo run:android
```
This builds and installs the development build on a connected device or emulator. After the first build, `npx expo start` is enough.

To build an installable APK with EAS:
```bash
eas build --profile preview --platform android
```

## Supabase setup

Run the scripts in `supabase/` from the Supabase SQL editor:

| Script | Purpose |
|---|---|
| `auto_approve_verified_users.sql` | Approves an account once its email is verified |
| `push_notifications.sql` | Sends push notifications on new messages and updates |
| `realtime_chat.sql` | Enables live chat updates |
| `report_suspension.sql` | Suspends reported accounts pending admin review |
| `demo_*.sql`, `add_partner_facilities.sql` | Optional demo facilities and postings |

## Detection server

The YOLO server lives in `deploy/yolo-space/`. See [its README](deploy/yolo-space/README.md) and `aws-setup.sh` to deploy it on an EC2 instance with HTTPS. The app reads the server address from `YOLO_URL` in `config.ts`.

Endpoints:
- `GET /` health check
- `POST /detect` takes an image file and returns the detected item, confidence, and boxes

## Load testing

The `loadtest/` folder contains [k6](https://k6.io) scripts:
```bash
cd loadtest
k6 run yolo-detect.js                                    # 1 user, 3 scans
k6 run -e PROFILE=load yolo-detect.js                     # up to 10 users
k6 run -e TEST_EMAIL=... -e TEST_PASSWORD=... supabase-browse.js
```
Use a test account, and run heavier profiles only when the app is not in use.

## Team

- [jobelleei](https://github.com/jobelleei)
- [Cherrii-isu](https://github.com/Cherrii-isu)
- [kayenieregolis15-coder](https://github.com/kayenieregolis15-coder)
