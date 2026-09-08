# MyCare+ Product Specification

## 1. Product direction

MyCare+ is a Rwanda-focused health tracking and education app with optional wellness shopping. Health tracking is the primary experience. Shopping supports care needs and is not payment-enabled in the first release.

Initial platforms:

- Android
- iOS
- Expo Web
- Phones and tablets

Initial language: English. The content model must support future Kinyarwanda translations.

## 2. Accounts and permissions

### Adult user

Users aged 18 and above can create and control their own account. They can:

- Manage their health profile
- Log periods, symptoms, mood, energy, sleep, medication, and notes
- View predictions and educational recommendations
- Manage their cart and orders
- Control parent sharing permissions
- Export or delete their health data

### Parent

A parent can use the account for their own health and manage linked minors. A parent can:

- Create and manage child profiles
- Record permitted child health information
- View child summaries and reminders
- Manage supplies and orders
- Read education content

Parent access to an adult's health data is disabled by default. An adult may grant full, summary-only, or no access and may revoke access at any time.

### Admin

Admins can manage users, relationships, products, product images, categories, discounts, orders, education content, support conversations, notifications, and audit logs. Admin access to sensitive health data must be minimized, permissioned, and audited.

## 3. User navigation

### Adult user

- Home
- Track
- Learn
- Shop
- Orders
- Profile

### Parent

- Home
- Children
- Learn
- Shop
- Orders
- Profile

### Admin

- Overview
- Users
- Children and permissions
- Products
- Orders
- Education
- Messages
- Settings

## 4. Adult health experience

### Home

Show a useful summary rather than placeholders:

- Greeting and profile action
- Current cycle phase
- Next predicted period window
- Current cycle day
- Recent symptoms or check-in status
- Reminder cards
- Recommended education
- Recommended products
- Recent activity

### Track

Support:

- Period start and end dates
- Flow intensity
- Cramps and pain
- Mood
- Energy
- Sleep
- Headache
- Appetite
- Discharge
- Medication
- Sexual-health check-ins where appropriate
- Free-form notes

Users can edit and delete entries.

### Predictions

Predictions must show:

- Estimated next period window
- Confidence or data quality indicator
- Cycle history
- Average cycle length
- Irregularity notice when appropriate
- Explanation that this is not a diagnosis

Predictions require enough historical data and must not imply certainty.

## 5. Parent and child experience

Parents can create linked child profiles and select which health areas they manage. The system must store:

- Relationship
- Consent or authorization state
- Date of birth or age band
- Access level
- Access history
- Transition state at age 18

When a child reaches 18, parent access is disabled by default and the person is invited to claim or create an independent account. Existing data transfer requires explicit consent.

## 6. Education

Education is written, published, and maintained by admins. Articles support:

- Title and summary
- Body content
- Cover image
- Category
- Age band
- Role visibility
- Language
- Draft, published, and archived state
- Author and timestamps

Initial categories:

- Menstrual health
- Puberty and body changes
- Hygiene
- Sexual health
- STI awareness
- Pregnancy prevention
- Pain management
- When to seek medical help
- Parent guidance

The app may recommend articles based on role and logged information, but recommendations must not present a diagnosis.

## 7. Shopping

Products are created and managed by admins. Product fields:

- Name
- Description
- Category
- Price
- Product images
- Availability
- Roles allowed to view the product
- Discount percentage
- Stock status

Users can browse, search, filter, add to cart, and create orders. Payment is deliberately excluded. Orders may use a `payment_pending` or equivalent state until a payment provider is selected.

## 8. Support

Support should use real backend messages rather than local demo state. Required capabilities:

- User creates a conversation
- User sends and receives messages
- Admin sees conversation list
- Admin replies
- Unread counts
- Conversation status
- Audit history

## 9. Backend domain models

Add or extend models for:

- HealthProfile
- HealthCheckIn
- PeriodLog
- SymptomEntry
- CyclePrediction
- ParentChildLink
- DataAccessGrant
- EducationArticle
- EducationCategory
- ProductImage
- SupportConversation
- SupportMessage
- Notification
- NotificationPreference

Existing User, Product, Order, and AuditLog models should remain the foundation.

## 10. API surface

Required user APIs:

- `GET/PATCH /api/profile/health`
- `GET/POST/PATCH/DELETE /api/health/check-ins`
- `GET/POST/PATCH/DELETE /api/health/periods`
- `GET /api/health/predictions`
- `GET /api/education`
- `GET /api/education/:id`
- `GET/POST /api/support/conversations`
- `GET/POST /api/support/conversations/:id/messages`
- `GET/PATCH /api/privacy/sharing`
- `GET/POST/PATCH/DELETE /api/children`
- `GET /api/products?role=...`
- `POST /api/orders`
- `GET /api/orders`

Required admin APIs:

- User and account status management
- Parent-child relationship management
- Product CRUD and image management
- Order management
- Education article CRUD and publishing
- Support conversation management
- Notification management
- Audit log access

All sensitive endpoints require ownership, relationship, or admin authorization checks.

## 11. Design system

Use one MyCare+ brand across roles:

- Light neutral background
- White content surfaces
- Charcoal primary text
- One consistent brand accent
- Restrained role accents
- Compact metric tiles
- Strong page titles
- Real product imagery
- Consistent icon buttons with accessibility labels
- Minimal shadows and fewer oversized cards
- Responsive layouts for small phones, large phones, tablets, and web

Every screen must define loading, empty, error, success, and offline states. User-facing copy must never mention APIs, endpoints, or implementation details.

## 12. Safety and privacy

- Health data is sensitive and must be protected in transit and at rest.
- Parent access is limited by relationship and consent state.
- Adult sharing is opt-in and revocable.
- Admin sensitive-data access is minimized and audited.
- Predictions and educational recommendations are informational, not medical diagnosis.
- Escalation guidance should recommend qualified medical care for concerning symptoms.
- Notification previews should avoid sensitive health details by default.
- Users can request deletion of health data.

## 13. Delivery order

1. Rebuild the shared brand system and responsive navigation.
2. Connect products and orders to the existing backend.
3. Implement health profiles, period logs, symptoms, and check-ins.
4. Implement prediction summaries and reminders.
5. Add education models, admin authoring, and user reading experience.
6. Add parent-child relationships and consent controls.
7. Add product images and admin catalog management.
8. Add real support messaging.
9. Add admin analytics, audit views, and operational states.
10. Test Android, iOS, web, tablet layouts, accessibility, offline behavior, authorization, and data deletion.

Payment integration remains intentionally out of scope until the provider is chosen.
