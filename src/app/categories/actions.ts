'use server'

import { Category } from "@/lib/types";
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


export async function upsertCategory(category: Partial<Category>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = await getAdminServices();

    if (category.id) {
      // Update existing category
      const categoryRef = firestore.collection('categories').doc(category.id);
      await categoryRef.set(category, { merge: true });
    } else {
      // Create new category
      const categoryRef = firestore.collection('categories').doc();
      await categoryRef.set({ ...category, id: categoryRef.id });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error upserting category:", error);
    return { success: false, error: error.message || 'Không thể tạo hoặc cập nhật danh mục.' };
  }
}

export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = await getAdminServices();
    
    // TODO: Check if any product is using this category before deleting.
    // For now, we will delete it directly.

    await firestore.collection('categories').doc(categoryId).delete();
    
    return { success: true };
  } catch (error: any) {
      console.error("Error deleting category:", error);
      return { success: false, error: error.message || 'Không thể xóa danh mục.' };
  }
}
