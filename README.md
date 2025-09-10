# Learnova — Course Management System (Vite + React + TS + Firebase)

Learnova is a role-based course management system with admin-controlled access. Only the pre-decided admin can log in by default; students and faculty require an admin-created active profile in Firestore before they can access the app.

## Tech Stack
- React 18 + TypeScript (Vite)
- Firebase (Auth, Firestore)
- TailwindCSS + shadcn/ui components
- React Router, TanStack Query

## Project Structure (high-level)
```
src/
  admin/                  # Admin-only pages
    AdminDashboard.tsx
    UserInfo.tsx
    Analytics.tsx
  components/
    layout/               # Header (top navbar) and layout
    auth/                 # Login form
    dashboard/            # Role dashboards (non-admin)
    ui/                   # shadcn/ui components
  contexts/
    AuthContext.tsx       # Firebase Auth + Firestore profile + admin controls
  pages/                  # App pages (Dashboard, Courses, etc.)
  firebase.ts             # Firebase app/auth/db
  index.css               # Tailwind + theme
```

## Prerequisites
- Node 18+
- Firebase project with Authentication and Firestore enabled

## Setup
1) Install dependencies
```bash
npm install
```

2) Environment variables
Create a `.env` file in the project root:
```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Pre-decided admin (only this email can log in without a profile)
VITE_ADMIN_EMAIL=admin@edu.com
```
Restart the dev server after changing `.env`.

3) Firebase Console configuration
- Authentication → Sign-in method → Enable Email/Password
- Authentication → Users → Add user
  - Email: same as `VITE_ADMIN_EMAIL`
  - Password: secure password
- Firestore Database → Create database

4) (Optional) Create admin profile document
- Collection: `users`
- Document ID: admin user UID from Authentication
- Fields:
  - `email` (string): admin email
  - `name` (string)
  - `role` (string): `admin`
  - `active` (boolean): `true`
  - Optional: `department`, `avatar`, `joinDate`

Note: The app grants the `VITE_ADMIN_EMAIL` user admin access even without a profile document. The profile only enriches display info.

## Running
```bash
npm run dev
```
App runs at `http://localhost:5173` (default Vite port).

## Scripts
- `npm run dev`: start dev server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint

## Access Control
- Only the `VITE_ADMIN_EMAIL` user can log in by default.
- Non-admin users (students/faculty) must have an admin-created Firestore profile in `users` with `active !== false`.
- If a profile is missing or inactive, login is rejected.

## Admin Features
- Pages under `/admin`:
  - `/admin` — Admin Dashboard
  - `/admin/userinfo` — Current admin’s info
  - `/admin/analytics` — Analytics scaffolding
- Admin-only actions (available from `useAuth()`):
  - `createOrUpdateUserProfile({ email, name?, role, department?, active?, avatar? })`
  - `updateUserRole(email, role)`
  - `setUserActive(email, active)`

These update Firestore documents in the `users` collection. Presence of a user document acts as admin approval for login.

## Firestore Collections (current)
- `users/{docId}`: user profiles
  - Fields: `email`, `name`, `role` ('admin' | 'faculty' | 'student'), `active` (boolean), optional `department`, `avatar`, `joinDate`
- `courses/{docId}`: course data (Courses page reads from here if present; falls back to demo data)

## Security Rules (recommended)
Implement Firestore Security Rules to enforce backend validation of roles and profile activation. Example direction:
- Allow read to authenticated users.
- Allow write to `users` only for admin users.
- Validate role and email formats.

## Backend Setup (Firebase Functions + Security Rules)

### Prerequisites
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project with Functions and Firestore enabled

### Deploy Backend
1) Install functions dependencies:
```bash
cd functions
npm install
```

2) Deploy Firestore Security Rules:
```bash
firebase deploy --only firestore:rules
```

3) Deploy Cloud Functions:
```bash
cd functions
npm run deploy
```

### Backend Features
- **Firestore Security Rules**: Restrict writes to admin users only
- **Cloud Functions**: Admin-only callable APIs:
  - `createOrUpdateUserProfile`
  - `updateUserRole` 
  - `setUserActive`

### Environment Variables
Update admin email in:
- `firestore.rules` (line 10)
- `functions/src/index.ts` (line 12)
- `.env` (`VITE_ADMIN_EMAIL`)

## Roadmap
- Admin Users management UI (list, create, roles, activation) ✅
- Mobile navbar (hamburger menu)
- Real analytics/stats from Firestore
- Course CRUD with role-based permissions
- Improved error/loading states
- Onboarding/invite flow (email or Cloud Functions)
- Tests and CI

## Troubleshooting
- `@import must precede all other statements`: Ensure `@import` is at the top of `src/index.css` (already adjusted).
- Auth not working: Verify `.env` values, enable Email/Password, and confirm `VITE_ADMIN_EMAIL` matches the admin user’s email.
- Firestore reads empty: Confirm collections exist and rules allow reads in your environment.

## License
MIT
