'use server'

import { Customer } from "@/lib/types";
import { firebaseConfig } from '@/firebase/config';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp, cert } from 'firebase-admin/app';
import { getFirestore,FieldValue } from "firebase-admin/firestore";

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

export async function getAdminServices() {
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


export async function upsertCustomer(customer: Partial<Customer>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = await getAdminServices();

    if (customer.id) {
      // Update existing customer
      const customerRef = firestore.collection('customers').doc(customer.id);
      await customerRef.set({
        ...customer,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } else {
      // Create new customer
      const customerRef = firestore.collection('customers').doc();
      await customerRef.set({ 
        ...customer, 
        id: customerRef.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error upserting customer:", error);
    return { success: false, error: error.message || 'Không thể tạo hoặc cập nhật khách hàng.' };
  }
}

export async function deleteCustomer(customerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = await getAdminServices();
    
    // TODO: Check if any transaction is using this customer before deleting.

    await firestore.collection('customers').doc(customerId).delete();
    
    return { success: true };
  } catch (error: any) {
      console.error("Error deleting customer:", error);
      return { success: false, error: error.message || 'Không thể xóa khách hàng.' };
  }
}
