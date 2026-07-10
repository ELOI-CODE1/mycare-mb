# MyCarePlus

A React Native / Expo mobile app for **menstrual & reproductive health tracking** with a built-in **health shop**, **user⇄admin messaging**, and **role-based dashboards** (girl / boy / parent / admin). Backed by [Supabase](https://supabase.com) for auth and data.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Backend & Database (Supabase)](#backend--database-supabase)
- [Seeding a Dev/Admin Account](#seeding-a-devadmin-account)
- [Configuration Notes & Known Caveats](#configuration-notes--known-caveats)
- [Scripts Reference](#scripts-reference)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) **SDK 54** (`~54.0.34`) |
| Runtime | React Native **0.81.5**, React **19.1.0** |
| Language | TypeScript (`strict: true`) |
| Navigation | React Navigation (native-stack) |
| Backend | Supabase (`@supabase/supabase-js`) — auth + Postgres + RLS |
| State | React Context (`AuthContext`, `CartContext`) |
| Local storage | `@react-native-async-storage/async-storage`, `expo-secure-store` |
| Notifications | `expo-notifications` |
| Calendar / charts | `react-native-calendars`, `react-native-chart-kit` + `react-native-svg` |

---

## Features

- **Role-based experience** — four user roles derived from a signup questionnaire: `girl`, `boy`, `parent`, `admin`. Each gets its own dashboard.
- **Menstrual cycle tracking** (girl / parent) — calendar logging, a **period prediction engine** (cycle-length statistics, confidence scoring, irregularity detection) and adaptive **reminder notifications**.
- **In-app health shop** — a product catalog (pads, condoms, pain relief, hygiene, test kits) with role-based visibility, a persistent cart, and order placement.
- **Order history** — past orders per user.
- **User⇄Admin messaging** — threaded messaging between users and admins.
- **Admin dashboard** — user management (suspend / soft-delete), overview stats, message inbox, and an audit log.
- **Account management** — profile, settings, security/privacy, and about screens.

---

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- **Expo CLI** — no global install needed; it's run via `npx` / npm scripts
- One of the following to view the app:
  - **Expo Go** app on a physical Android/iOS device (easiest), **or**
  - **Android emulator** (Android Studio), **or**
  - **iOS Simulator** (macOS + Xcode only)

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm start
```

That's it — the app currently ships with a working Supabase backend configured out of the box (see [caveats](#configuration-notes--known-caveats) regarding hardcoded credentials).

---

## Running the App

Start the Metro bundler, then choose a target:

```bash
npm start        # start the dev server (Metro bundler) + QR code
```

From the interactive Metro terminal, press:

| Key | Action |
|-----|--------|
| `a` | Open on **Android** emulator/device |
| `i` | Open on **iOS** simulator (macOS only) |
| `w` | Open in the **web** browser |

Or launch a target directly:

```bash
npm run android  # build & open on Android
npm run ios      # build & open on iOS (macOS only)
npm run web      # open in a web browser
```

### On a physical device
Install **Expo Go** from the App Store / Play Store, run `npm start`, then scan the QR code printed in the terminal.

---

## Project Structure

```
MyCarePlus/
├── App.tsx                     # Root component — provider tree + navigation
├── index.ts                    # Expo entry point (registerRootComponent)
├── app.json                    # Expo app config
├── babel.config.js             # Babel (babel-preset-expo)
├── tsconfig.json               # TypeScript config (strict)
├── scripts/
│   └── seed-dev.mjs            # Creates a dev/admin account in Supabase
├── supabase/
│   ├── admin_user_management.sql  # profiles.status, audit log, RLS
│   └── messages.sql               # messages table + RLS
├── assets/                     # icons + splash
└── src/
    ├── components/
    │   ├── ui/                 # Design-system primitives (Button, Card, Input, Text…)
    │   ├── admin/             # AdminOverview, AdminUsers
    │   ├── messaging/          # Message inbox, threads, bubbles, modals
    │   ├── AppHeader.tsx
    │   ├── ProductCard.tsx / OrderCard.tsx
    │   └── CartModal.tsx / AddToCartModal.tsx
    ├── context/
    │   ├── AuthContext.tsx     # Session + profile + role
    │   └── CartContext.tsx     # Cart state (persisted)
    ├── lib/
    │   └── supabase.ts         # Supabase client
    ├── navigation/
    │   └── RootNavigator.tsx   # Auth-gated native-stack + RoleRouter
    ├── screens/
    │   ├── Login / SignUp / RoleSelection / NoRoleScreen
    │   ├── GirlDashboard / BoyDashboard / ParentDashboard / AdminDashboard
    │   └── Account / Profile / Settings / Security / About
    ├── theme/                  # Design tokens (colors, spacing, per-role colors)
    ├── data/
    │   └── products.ts         # Static product catalog
    └── utils/
        ├── notificationService.ts  # Period reminder notifications
        ├── periodPredictor.ts.ts   # Cycle prediction engine
        └── periodStorage.ts        # Local cycle data persistence
```

---

## Architecture

### Provider tree (`App.tsx`)

```
GestureHandlerRootView
└── SafeAreaProvider
    └── AuthProvider          # session, profile, role, signIn/signOut
        └── CartProvider      # cart items (persisted to AsyncStorage)
            └── NavigationContainer
                └── RootNavigator
```

### Navigation & routing (`src/navigation/RootNavigator.tsx`)

A single **native-stack** navigator, auth-gated:

- **No session** → `Login`, `SignUp`
- **Session present** → `Home` (+ account screens: `Account`, `Profile`, `Settings`, `Security`, `About`)
- A **Splash** (spinner) is shown while the session/profile is loading, to avoid flashing the "no role" screen.

`Home` renders a **`RoleRouter`** that switches on the user's `role`:

| Role | Dashboard |
|------|-----------|
| `admin` | `AdminDashboard` |
| `girl` | `GirlDashboard` |
| `boy` | `BoyDashboard` |
| `parent` | `ParentDashboard` |
| *(none)* | `NoRoleScreen` |

> Dashboards implement their **own in-screen tabs** (via the `Segmented` UI component, e.g. GirlDashboard → `shop` / `cycle` / `orders`) rather than a bottom-tab navigator.

### Auth (`src/context/AuthContext.tsx`)

- Tracks the Supabase session via `getSession()` + `onAuthStateChange`.
- Fetches the user's row from the **`profiles`** table (`id, email, full_name, role, phone, created_at`) and exposes `role`.
- Provides `signIn` (password), `signOut`, and a `useAuth()` hook.

---

## Backend & Database (Supabase)

The Supabase client lives in `src/lib/supabase.ts`. It uses `AsyncStorage` for session persistence, `autoRefreshToken` + `persistSession`, and an `AppState` listener to pause/resume token refresh in the background.

### Tables used by the app

| Table | Purpose |
|-------|---------|
| `profiles` | User profile + `role` + `status` (`active` / `suspended` / `deleted`) |
| `orders` | Placed orders (`product_id, product_name, quantity, total_price, status`) |
| `messages` | User⇄admin threaded messaging (`sender`, `is_read`) |
| `admin_audit_log` | Admin action audit trail |

### Applying the schema

The SQL in `supabase/` must be run **manually** in the Supabase **SQL Editor** (in order):

1. `supabase/admin_user_management.sql` — adds `profiles.status`, the `admin_audit_log` table, an `is_admin()` helper, and RLS policies.
2. `supabase/messages.sql` — creates the `messages` table, indexes, and RLS policies.

---

## Seeding a Dev/Admin Account

`scripts/seed-dev.mjs` creates a full-privilege admin account for local development:

```bash
node scripts/seed-dev.mjs
```

- It reads the Supabase URL + anon key by parsing `src/lib/supabase.ts` (so credentials aren't retyped).
- It signs up (or signs in) a hardcoded dev account and upserts an `admin` row into `profiles`.
- **Note:** if email confirmation is enabled on the Supabase project, there's no session and the RLS-protected profile insert can fail — the script prints a fallback SQL `UPDATE` to run manually in that case.

> ⚠️ The seed script contains a hardcoded email/password intended for development only. Do not use it against production.

---

## Configuration Notes & Known Caveats

These are worth knowing before extending or shipping the app:

- 🔐 **Hardcoded credentials.** The Supabase URL + anon key are committed in `src/lib/supabase.ts` (there's a `// TODO` to move them to env config and rotate the key), and `seed-dev.mjs` has a hardcoded dev password. Move these to environment variables and rotate before any production use.
- 🧩 **Unused dependencies.** `react-native-dotenv`, `flutterwave-react-native`, and `@react-navigation/bottom-tabs` are installed but **not wired in**. In particular, **payments are not implemented** — checkout currently just inserts an order with `status: 'pending'`; Flutterwave is a placeholder.
- 🔔 **Notifications plugin not declared.** `expo-notifications` is used (`src/utils/notificationService.ts`, Android `period-reminders` channel) but there is no notifications config plugin in `app.json` — add it before a production build.
- 🗂️ **`src/utils/periodPredictor.ts.ts`** has a doubled `.ts.ts` extension.
- 📁 **`tsconfig.json`** references a `src/types` directory that does not yet exist.
- 📄 **`AGENTS.md`** references Expo **v56** docs, but the project is pinned to Expo **SDK 54** — treat the installed SDK (54) as the source of truth.
- 🛠️ **No EAS config.** There is no `eas.json` yet; native production builds would require setting up [EAS Build](https://docs.expo.dev/build/introduction/).

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo dev server (Metro bundler) |
| `npm run android` | Build & open on Android |
| `npm run ios` | Build & open on iOS (macOS only) |
| `npm run web` | Open in a web browser |
| `node scripts/seed-dev.mjs` | Create a dev/admin account in Supabase |

---

*Built with Expo SDK 54 + Supabase.*
