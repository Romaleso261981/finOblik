import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function getApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase доступний лише в браузері");
  }
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getApp());
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) db = getFirestore(getApp());
  return db;
}

export function orgPath(orgId: string) {
  return `orgs/${orgId}` as const;
}

export function accountsCollection(orgId: string) {
  return `${orgPath(orgId)}/accounts`;
}

export function categoriesCollection(orgId: string) {
  return `${orgPath(orgId)}/categories`;
}

export function transactionsCollection(orgId: string) {
  return `${orgPath(orgId)}/transactions`;
}

export function workHoursCollection(orgId: string) {
  return `${orgPath(orgId)}/workHours`;
}

export function membersCollection(orgId: string) {
  return `${orgPath(orgId)}/members`;
}
