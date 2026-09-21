import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import configData from '../../firebase-applet-config.json';

// Your web app's Firebase configuration matching user configuration
export const firebaseConfig = {
  apiKey: configData.apiKey || "AIzaSyC8dZtvwb5SOFVxdP-0ZbkxxDTy5yTarCY",
  authDomain: configData.authDomain || "strike9sports-b4723.firebaseapp.com",
  projectId: configData.projectId || "strike9sports-b4723",
  storageBucket: configData.storageBucket || "strike9sports-b4723.firebasestorage.app",
  messagingSenderId: configData.messagingSenderId || "73204758999",
  appId: configData.appId || "1:73204758999:web:f63cf099333da89c29f392",
  measurementId: configData.measurementId || "G-VLFSY2XR76",
};

// Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID and experimentalForceLongPolling for container/iframe environments
let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    },
    configData.firestoreDatabaseId || undefined
  );
} catch {
  firestoreDb = configData.firestoreDatabaseId
    ? getFirestore(app, configData.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreDb;

export const auth = getAuth(app);

// Initialize Analytics when in browser environment and supported
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn('Analytics initialization skipped:', err);
      }
    }
  }).catch(() => {});
}

// Firestore Error Handler Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  if (errMessage.includes('Missing or insufficient permissions') || errMessage.includes('permission-denied')) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Connection test as required by skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection note (operating in cached/offline mode until backend stream syncs):', error.message);
    }
  }
}

testConnection();

export default app;
