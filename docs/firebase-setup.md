# Firebase Setup Guide for BankSphere

## 1. Firebase Project Creation
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `banksphere-prod` (or `banksphere-dev`).
3. Enable Google Analytics if desired.

## 2. Authentication Setup
1. In the left navigation, open **Build > Authentication**.
2. Click **Get Started**.
3. Enable **Email/Password** provider.
4. (Optional) Configure Multi-Factor Authentication (MFA) under SMS/TOTP settings.

## 3. Cloud Storage Setup
1. Open **Build > Storage** and click **Get Started**.
2. Select **Start in production mode**.
3. Choose a storage bucket location (e.g. `asia-east1`).
4. Apply standard security rules requiring user authentication for `/users/{uid}/*`.

## 4. Admin SDK Service Account Key
1. Navigate to **Project Settings > Service Accounts**.
2. Click **Generate new private key**.
3. Copy `project_id`, `client_email`, and `private_key` into your backend `.env` configuration.
