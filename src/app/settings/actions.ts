'use server'

import { ThemeSettings } from "@/lib/types";
import { firebaseConfig } from '@/firebase/config';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp, cert } from 'firebase-admin/app';
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!serviceAccountB64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 environment variable is not set.');
  }
  try {
    const serviceAccountJson = Buffer.from(serviceAccountB64, 'base64').toString('utf-8');
    return JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error('Failed to parse service account JSON.', e);
    throw new Error('Invalid service account credentials format.');
  }
}

async function getAdminServices() {
    if (!getAdminApps().length) {
       const serviceAccount = getServiceAccount();
       initializeAdminApp({
         credential: cert(serviceAccount),
         databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
       });
    }
    const adminApp = getAdminApp();
    return { firestore: getFirestore(adminApp) };
}


export async function upsertThemeSettings(settings: ThemeSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = await getAdminServices();

    const settingsRef = firestore.collection('settings').doc('theme');
    await settingsRef.set(settings, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error("Error upserting theme settings:", error);
    return { success: false, error: error.message || 'Không thể cập nhật cài đặt giao diện.' };
  }
}

export async function getThemeSettings(): Promise<ThemeSettings | null> {
    try {
        const { firestore } = await getAdminServices();
        const doc = await firestore.collection('settings').doc('theme').get();
        if (doc.exists) {
            return doc.data() as ThemeSettings;
        }
        return null;
    } catch (error) {
        console.error("Error getting theme settings:", error);
        return null;
    }
}
