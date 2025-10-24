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
  sale: Omit<Sale, 'id' | 'totalAmount' > & { totalAmount: number }, 
  // The items passed here have their quantity in the base unit
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

        // The logic for updating stock is now implicitly handled by how we calculate stock on the product page.
        // We read all purchase lots and subtract all sales items.
        // As long as this sale item is created, the stock calculation will be correct.
      }
      
      // 3. Create a payment document if customerPayment is provided
      if (sale.customerPayment && sale.customerPayment > 0 && sale.customerId) {
        const paymentRef = firestore.collection('payments').doc();
        transaction.set(paymentRef, {
            id: paymentRef.id,
            customerId: sale.customerId,
            paymentDate: sale.transactionDate,
            amount: sale.customerPayment,
            notes: `Thanh toán cho đơn hàng ${saleRef.id.slice(-6).toUpperCase()}`
        });
      }


      return saleRef.id;
    });

    return { success: true, saleId };
  } catch (error: any) {
    console.error("Error creating sale transaction:", error);
    return { success: false, error: error.message || 'Không thể tạo đơn hàng.' };
  }
}
