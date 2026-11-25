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
