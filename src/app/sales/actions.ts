'use server'

import { Sale, SalesItem } from "@/lib/types";
import { firebaseConfig } from '@/firebase/config';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, runTransaction } from "firebase-admin/firestore";

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

export async function upsertSaleTransaction(
  sale: Omit<Sale, 'id'>, 
  items: Omit<SalesItem, 'id' | 'salesTransactionId'>[]
): Promise<{ success: boolean; error?: string; saleId?: string }> {
  const { firestore } = await getAdminServices();

  try {
    const saleId = await runTransaction(firestore, async (transaction) => {
      const saleRef = firestore.collection('sales_transactions').doc();
      
      // 1. Create the main sale document
      transaction.set(saleRef, { ...sale, id: saleRef.id });

      const saleItemsCollection = saleRef.collection('sales_items');

      for (const item of items) {
        const productRef = firestore.collection('products').doc(item.productId);
        
        // 2. Create sales_item document
        const saleItemRef = saleItemsCollection.doc();
        transaction.set(saleItemRef, { 
          ...item, 
          id: saleItemRef.id,
          salesTransactionId: saleRef.id 
        });

        // 3. Update product stock (this is a simplified example)
        // A more robust solution would check for sufficient stock before proceeding.
        // We are assuming the quantity is in the product's primary unit for simplicity.
        // This part is commented out as it requires a more complex stock management logic
        // that considers different units and conversion factors, which is beyond this scope.
        // You would typically subtract from an `inventory` field on the product.
        
        // For example:
        // const productDoc = await transaction.get(productRef);
        // if (!productDoc.exists) {
        //   throw new Error(`Product with ID ${item.productId} not found.`);
        // }
        // const currentStock = productDoc.data()?.stock || 0;
        // if (currentStock < item.quantity) {
        //   throw new Error(`Not enough stock for product ${productDoc.data()?.name}.`);
        // }
        // transaction.update(productRef, {
        //   stock: FieldValue.increment(-item.quantity)
        // });
      }

      return saleRef.id;
    });

    return { success: true, saleId };
  } catch (error: any) {
    console.error("Error creating sale transaction:", error);
    return { success: false, error: error.message || 'Không thể tạo đơn hàng.' };
  }
}
