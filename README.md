# MyCare+

An Expo / React Native mobile app for menstrual and reproductive-health tracking.

## Current status

This repository contains frontend code only. It has no bundled backend, database configuration, authentication provider, storage integration, credentials, migrations, or seed scripts.

Authentication screens remain in place as UI, but login, registration, and password reset are intentionally unavailable until the app is connected to your API endpoints.

## Development

```bash
npm install
npm start
```

## Connecting your backend

When your separate backend is ready, add a frontend API layer that calls its endpoints. Keep server secrets and privileged credentials exclusively in that backend; only public configuration should be included in the Expo app.
