---
description: How to start the Memora development environment
---

## Prerequisites
- Node.js installed
- MongoDB running locally on port 27017

## Steps

1. Start the MongoDB server if not already running

2. Start the backend server
```bash
cd d:\college\memora\server
node server.js
```
The server should log: `✅ Connected to MongoDB` and `🚀 Memora server running on port 5000`

3. Start the frontend dev server
```bash
cd d:\college\memora\client
npx vite --host 0.0.0.0
```
The frontend should be available at http://localhost:5173

## Environment Variables (server/.env)
- `PORT=5000`
- `MONGODB_URI=mongodb://localhost:27017/memora`
- `JWT_SECRET=memora_secret_key_2026_change_in_production`
- `UPLOAD_DIR=./uploads`
