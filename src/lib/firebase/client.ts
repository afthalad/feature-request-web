import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();

/**
 * The signed-in user's ID token. Dashboard pages render from the server session before Firebase
 * has restored the user in the browser, so wait for that first: a click straight after load
 * would otherwise find currentUser still null.
 */
export async function getCurrentIdToken(): Promise<string | undefined> {
  await auth.authStateReady();
  return auth.currentUser?.getIdToken();
}
