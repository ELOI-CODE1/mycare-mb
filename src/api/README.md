# API integration points

Set `EXPO_PUBLIC_API_URL` in a local `.env` file. Use the backend machine's LAN
address when testing on a physical phone, or the emulator-specific host address
when testing in an Android emulator. Never put Paypack credentials in this app.

The screens intentionally contain no database client. Connect the separate backend through a small API client and map its responses to the types in `types.ts`.

The required response fields are:

- products: `imageUrl`, `imageUrls`, `discountPercent`, details, and price
- messages: stable `username` plus `email`; email distinguishes users with the same name
- accounts: location and verification state
- orders: items, delivery address, and contact phone

Message sending should return the created message so the optimistic message in the composer can be reconciled immediately.
