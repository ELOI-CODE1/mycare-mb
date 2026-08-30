# API integration points

The screens intentionally contain no database client. Connect the separate backend through a small API client and map its responses to the types in `types.ts`.

The required response fields are:

- products: `imageUrl`, `imageUrls`, `discountPercent`, details, and price
- messages: stable `username` plus `email`; email distinguishes users with the same name
- accounts: location and verification state
- orders: items, delivery address, and contact phone

Message sending should return the created message so the optimistic message in the composer can be reconciled immediately.
