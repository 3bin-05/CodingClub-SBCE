# CSE SBCE Coding Club Portal

A secure, dynamic, and modern single-page web portal engineered for the **Computer Science & Engineering department's Coding Club** at **Sree Buddha College of Engineering (SBCE), Pattoor**. Built using React, Vite, Tailwind CSS, and Firebase.

---

## 🚀 Key Features

* **Dynamic Content management**: Manage upcoming club events, executive committee (Execom) members, social settings, and photo galleries dynamically from an administrative control hub.
* **Google Sign-In Only Authentication**: Zero passwords to manage. Admins authenticate securely using Google credentials.
* **Super-Admin & Admin RBAC**: 
  - **Super-Admin**: Full rights to approve/reject access requests, toggle active statuses, change roles, and edit site data.
  - **Admin**: Standard CRUD operations for website sections (Events, Gallery, Execom).
* **Admin Access Request System**: Unauthorized logins trigger a pending review request document in Firestore. Approved admins gain instant dashboard access via real-time listeners.
* **Audit Logs**: Comprehensive logs tracking every administrative write action, recording who performed it, when, and what changed.
* **Production-Grade Security**: Secured client-side using rigorous Firestore Security Rules (`firestore.rules`). Fully compatible with the free Firebase Spark plan (no billing or Cloud Functions required).
* **ImgBB URL Integration**: Live validation, rendering loaders, and broken-image fallbacks for external direct image URLs.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion v12, Lucide Icons.
* **Database & Auth**: Cloud Firestore (Real-time DB), Firebase Authentication (Google Sign-In).
* **Styling**: Sleek dark-mode aesthetic with custom glassmorphism panels, interactive neon glows, and micro-animations.

---

## ⚙️ Initial Project Setup

### 1. Clone & Install Dependencies
Ensure you have [Node.js](https://nodejs.org/) installed, then run:
```bash
npm install
```

### 2. Configure Firebase Environment Variables
Create a `.env` file in the root directory and populate it with your Firebase Web SDK config credentials (refer to `.env.example`):
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=coding-club-sbce.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=coding-club-sbce
VITE_FIREBASE_STORAGE_BUCKET=coding-club-sbce.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Enable Google Authentication
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and navigate to **Authentication** > **Sign-in method**.
3. Click **Add new provider** and select **Google**.
4. Enable the provider, specify your support email, and save.

---

## 🔒 Security Rules & Database Bootstrapping

### 1. Deploy Firestore Security Rules
Ensure the Firebase CLI is installed and configured, then deploy the validated rules from the project root:
```bash
firebase deploy --only firestore:rules
```

### 2. Seed Initial Mock Data
We've provided a migration script to upload your initial events, committee list, gallery records, and configurations to Firestore automatically. Run:
```bash
npx tsx scripts/migrate.ts
```

### 3. Claim the First Super-Admin Role (Bootstrap)
Because security rules protect the database, a bootstrap state exists:
1. Run the local dev server (`npm run dev`).
2. Go to the Admin tab (`/admin/login`).
3. Click **Sign In with Google** and complete the login.
4. The system will detect that there are currently no active super-admins in Firestore. It will automatically write your account as the first `super_admin` in `admins/{uid}` and initialize `metadata/admin_config` to lock the system down.
5. All subsequent admin sign-ins will go to the **Access Requests** queue for your manual approval.

---

## 🖥️ Local Development

To run the development server:
```bash
npm run dev
```

To compile the production build:
```bash
npm run build
```
