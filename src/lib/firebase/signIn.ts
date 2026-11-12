/**
 * Everything Google sign-in needs, behind one module so it can be loaded lazily. Named re-exports
 * (not `import("firebase/auth")`) keep tree-shaking intact for Firebase's large auth package.
 */
export { onAuthStateChanged, signInWithPopup } from "firebase/auth";
export { FirebaseError } from "firebase/app";
export { auth, googleAuthProvider } from "./client";
