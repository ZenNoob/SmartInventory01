

'use server'

import { ThemeSettings, Customer, Payment, LoyaltySettings } from "@/lib/types";
import { getAdminServices } from "@/lib/admin-actions";
import { toPlainObject } from "@/lib/utils";
import { FieldValue } from "firebase-admin/firestore";

export async function upsertThemeSettings(settings: Partial<ThemeSettings>): Promise<{ success: boolean; error?: string }> {
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
            const data = doc.data();
            return toPlainObject(data) as ThemeSettings;
        }
        return null;
    } catch (error) {
        console.error("Error getting theme settings:", error);
        return null;
    }
}

export async function recalculateAllLoyaltyPoints(): Promise<{ success: boolean; error?: string; processedCount?: number }> {
  try {
    const { firestore } = await getAdminServices();

    // 1. Fetch current loyalty settings
    const settingsDoc = await firestore.collection('settings').doc('theme').get();
    const loyaltySettings = settingsDoc.data()?.loyalty as LoyaltySettings | undefined;

    if (!loyaltySettings || !loyaltySettings.pointsPerAmount || loyaltySettings.pointsPerAmount <= 0) {
      return { success: false, error: "Chưa cấu hình chương trình khách hàng thân thiết hoặc tỷ lệ tích điểm không hợp lệ." };
    }

    // 2. Fetch all customers and payments
    const customersSnapshot = await firestore.collection('customers').get();
    const paymentsSnapshot = await firestore.collection('payments').get();

    // 3. Process data in memory
    const paymentsByCustomer = new Map<string, number>();
    paymentsSnapshot.forEach(doc => {
      const payment = doc.data() as Payment;
      const currentTotal = paymentsByCustomer.get(payment.customerId) || 0;
      paymentsByCustomer.set(payment.customerId, currentTotal + payment.amount);
    });
    
    const sortedTiers = loyaltySettings.tiers.sort((a, b) => b.threshold - a.threshold);
    const batch = firestore.batch();
    let processedCount = 0;

    // 4. Iterate through customers and prepare batch updates
    customersSnapshot.forEach(doc => {
      const customer = doc.data() as Customer;
      const customerRef = doc.ref;

      const totalPaid = paymentsByCustomer.get(customer.id) || 0;
      const newPoints = Math.floor(totalPaid / loyaltySettings.pointsPerAmount);

      const newTier = sortedTiers.find(tier => newPoints >= tier.threshold);
      const newTierName = newTier?.name || undefined;

      // Only update if there's a change to avoid unnecessary writes
      if (customer.lifetimePoints !== newPoints || customer.loyaltyTier !== newTierName) {
         batch.update(customerRef, {
            lifetimePoints: newPoints,
            loyaltyTier: newTierName || FieldValue.delete(), // Remove tier if no longer qualified
         });
      }
      processedCount++;
    });

    // 5. Commit all updates in a single batch
    await batch.commit();

    return { success: true, processedCount };

  } catch (error: any) {
    console.error("Error recalculating loyalty points:", error);
    return { success: false, error: error.message || 'Không thể tính toán lại điểm khách hàng.' };
  }
}

async function deleteCollection(firestore: FirebaseFirestore.Firestore, collectionPath: string, batchSize: number) {
    const collectionRef = firestore.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise<void>((resolve, reject) => {
        deleteQueryBatch(firestore, query, resolve, reject);
    });
}

async function deleteQueryBatch(firestore: FirebaseFirestore.Firestore, query: FirebaseFirestore.Query, resolve: () => void, reject: (error: any) => void) {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid hitting stack limit.
    process.nextTick(() => {
        deleteQueryBatch(firestore, query, resolve, reject);
    });
}

export async function deleteAllTransactionalData(): Promise<{ success: boolean, error?: string }> {
  try {
    const { firestore } = await getAdminServices();

    // Collections to delete
    const collectionsToDelete = ['sales_transactions', 'purchase_orders', 'payments'];

    for (const collectionPath of collectionsToDelete) {
      await deleteCollection(firestore, collectionPath, 100);
    }

    // Reset fields in 'products' collection
    const productsSnapshot = await firestore.collection('products').get();
    const productBatch = firestore.batch();
    productsSnapshot.forEach(doc => {
      productBatch.update(doc.ref, { purchaseLots: [] });
    });
    await productBatch.commit();
    
    // Reset fields in 'customers' collection
    const customersSnapshot = await firestore.collection('customers').get();
    const customerBatch = firestore.batch();
    customersSnapshot.forEach(doc => {
        customerBatch.update(doc.ref, { 
            loyaltyPoints: 0, 
            lifetimePoints: 0,
            loyaltyTier: FieldValue.delete()
        });
    });
    await customerBatch.commit();

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting transactional data:", error);
    return { success: false, error: error.message || "Không thể xóa dữ liệu giao dịch." };
  }
}
