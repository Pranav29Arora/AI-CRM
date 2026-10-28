# AI-CRM — Firebase Integration Guide (Authentication & Cloud Firestore)

## Project Configuration

- **Project ID**: `ai-crm-f73a5`
- **Location**: `asia-south1` (Mumbai)
- **Authentication**: Google Firebase Authentication (Email/Password)
- **Database**: Google Cloud Firestore (Test Mode)
- **Auth Domain**: `ai-crm-f73a5.firebaseapp.com`
- **Storage Bucket**: `ai-crm-f73a5.firebasestorage.app`

---

## 1. Firebase Authentication (`authService`)

The authentication layer is wired directly into **Firebase Authentication**:
- **Login**: `signInWithEmailAndPassword(auth, email, password)`
- **Signup**: `createUserWithEmailAndPassword(auth, email, password)`
- **Sign Out**: `signOut(auth)`
- **Session Tokens**: Uses real Firebase cryptographically signed ID tokens (`user.getIdToken()`).
- **User Profile Hydration**: On login/signup, profile metadata (Role, Company, Avatar) is saved to the `users/{uid}` collection in Cloud Firestore.
- **Backend Protected Routes**: Backend middleware verifies the Firebase JWT token on protected REST endpoints (`/api/products`, `/api/customers`, `/api/negotiations`, etc.).

### Verified Demo Account
The pre-configured account is registered directly in Firebase Auth:
- **Email**: `demo@aicrm.com`
- **Password**: `demo123`
- **UID**: `n9Hn9bsKjHOrw25bO0RArBIKuNl1`
- **Role**: Wholesale & Retail Director

---

## 2. Cloud Firestore Collections

- 📦 **`products`**: Wholesale catalog with strict pricing boundary guardrails (Cost Price, Absolute Floor, Preferred Min, Target Price).
- 👥 **`customers`**: Wholesale accounts with budgets, contact numbers, and lead statuses.
- ⚡ **`negotiations`**: Deal workspaces with profit margins and multi-round timeline logs.
- 💬 **`conversations`**: WhatsApp message history and unread counters.
- ⏰ **`reminders`**: Scheduled follow-up tasks evaluated by the background worker.
- 👤 **`users`**: User profiles with company details, role, and avatar.

---

## 3. Live Cloud Synchronization
All writes and reads through the website UI or REST API persist immediately to **Cloud Firestore**. 
The **"Reset Cloud Data"** button in the sidebar can re-seed your collections anytime.
