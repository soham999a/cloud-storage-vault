# Google Sign-In Fix Guide

## Problem
The Google sign-in functionality in your Cloud Storage Vault application is failing with the error message: "Google sign-in failed. Please try again."

## Root Causes
There are several potential causes for this issue:

1. **Unauthorized Domain**: Your domain is not authorized in the Firebase console
2. **Invalid App ID**: The Firebase App ID might be incorrect
3. **Popup Blocking**: Browser popup blockers might be preventing the sign-in window
4. **Redirect Handling**: Issues with handling the redirect flow

## Solutions Implemented

I've implemented several fixes to address these issues:

1. **Added Redirect Method Fallback**: Now the app will try to use the popup method first, and if that fails, it will fall back to the redirect method.

2. **Fixed App ID Handling**: Added code to detect and fix invalid App IDs.

3. **Enhanced Error Handling**: Added detailed error messages to help diagnose issues.

4. **Created Test Pages**: Added two test pages to help diagnose and fix Google sign-in issues:
   - `google-auth-test.html`: Tests basic Firebase authentication
   - `google-signin-test.html`: Specifically tests Google sign-in with both popup and redirect methods

## How to Fix the Issue

### Step 1: Verify Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project "cloud-storage-vault-c9e0c"
3. Go to Project Settings > General
4. Verify that the App ID matches what's in your `firebase-config.js` file
5. If it doesn't match, update the App ID in your code

### Step 2: Add Your Domain to Authorized Domains

1. Go to the Firebase Console
2. Select your project
3. Go to Authentication > Sign-in method
4. Scroll down to "Authorized domains"
5. Add your domain (e.g., `cloud-storage-vault.vercel.app`)
6. Also add any preview domains from Vercel (e.g., `cloud-storage-vault-git-main-yourusername.vercel.app`)

### Step 3: Enable Google Sign-In Provider

1. Go to the Firebase Console
2. Select your project
3. Go to Authentication > Sign-in method
4. Click on Google in the list of providers
5. Make sure it's enabled
6. Save the changes

### Step 4: Test with the Test Pages

1. Open `google-signin-test.html` in your browser
2. Try both the "Sign in with Popup" and "Sign in with Redirect" buttons
3. Check the console logs for any errors
4. If one method works but the other doesn't, you can use the working method in your app

### Step 5: Update Your Code

If the test pages work but your main app still doesn't, make sure you've integrated all the changes I've made to:

- `firebase-config.js`
- `3d-vault.html` (the Google sign-in button handlers)

## Troubleshooting

### If Popup Method Fails
- Check if popups are being blocked by your browser
- Try using the redirect method instead

### If Redirect Method Fails
- Make sure your domain is authorized in Firebase
- Check the browser console for specific error messages

### If Both Methods Fail
- Verify your Firebase project settings
- Make sure Google Sign-In is enabled as a provider
- Check that your API keys are correct

## Need More Help?

If you're still experiencing issues, try these steps:

1. Open your browser's developer console (F12) when attempting to sign in
2. Look for specific error messages
3. Check the Network tab to see if there are any failed requests
4. Try signing in from a different browser or device

The most common issue is that your domain is not authorized in Firebase. Make sure to add all domains where your app will be hosted to the authorized domains list in the Firebase console.
