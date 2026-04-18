# Firebase Setup

Steps to enable sign-in, ratings, and comments. Takes ~5 minutes.

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com
2. **Add project** → name it (e.g. `japan-trip`). Analytics optional.
3. Once created, click the web icon (`</>`) to **Add a web app**. Name it anything.
4. Firebase shows a config snippet. Copy the values.

## 2. Paste config into `firebase-config.js`

Open `firebase-config.js` and replace the placeholder values with the ones from the console:

```js
window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

These values are **public by design** — safe to commit. Security is enforced by Firestore rules (step 4).

## 3. Enable Google sign-in

In the Firebase console sidebar: **Build → Authentication → Get started → Sign-in method → Google → Enable → Save.**

Then under **Authentication → Settings → Authorized domains**, add:

- `localhost` (already there by default)
- `amindell11.github.io` (for the deployed site)

## 4. Create the Firestore database

**Build → Firestore Database → Create database → Start in production mode → pick a region (e.g. `asia-northeast1`)**

Then go to the **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /places/{placeId} {
      // Aggregate doc: any signed-in user can read/write (only touched via transactions client-side)
      allow read: if true;
      allow write: if request.auth != null;

      match /ratings/{uid} {
        allow read: if true;
        allow write: if request.auth != null
          && request.auth.uid == uid
          && request.resource.data.rating is number
          && request.resource.data.rating >= 1
          && request.resource.data.rating <= 5;
      }

      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.text is string
          && request.resource.data.text.size() <= 2000;
        allow delete: if request.auth != null
          && resource.data.uid == request.auth.uid;
      }
    }
  }
}
```

Click **Publish**.

## 5. Test locally

```
python -m http.server 8000
```

Open http://localhost:8000, click **Sign in**, rate a place, post a comment. Open another browser (or incognito) and sign in as a different friend to verify it syncs.

## 6. Restrict access (optional but recommended)

Only your 5 friends should be able to write. Two options:

- **Easy:** share the URL only with them; the rules above already require Google auth.
- **Tighter:** swap the `ratings` and `comments` rules to check a hardcoded allow-list:

  ```
  allow write: if request.auth != null
    && request.auth.token.email in [
      'friend1@gmail.com', 'friend2@gmail.com', ...
    ];
  ```

## Free tier limits

Firebase free tier (Spark plan): 50k reads/day, 20k writes/day, 1 GiB storage. With 5 users and ~40 places, you'll use <0.1% of this. No credit card needed unless you upgrade.
