'use server'

import { Sale, SalesItem } from "@/lib/types";
import { getAdminServices } from "@/lib/admin-actions";

async function getNextSaleId(firestore: FirebaseFirestore.Firestore, transaction: FirebaseFirestore.Transaction): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const datePrefix = `HD${year}${month}${day}`;

    const salesCollection = firestore.collection('sales_transactions');
    // We need to query for IDs starting with the prefix.
    // Firestore's `where` clause with string operations is what we need.
    const query = salesCollection
        .where('id', '>=', datePrefix)
        .where('id', '<', datePrefix + 'z') // 'z' is a char that is after all digits
        .orderBy('id', 'desc')
        .limit(1);

    const snapshot = await transaction.get(query);
    
    let nextSequence = 1;
    if (!snapshot.empty) {
        const lastId = snapshot.docs[0].id;
        const lastSequence = parseInt(lastId.substring(datePrefix.length), 10);
        nextSequence = lastSequence + 1;
    }

    const sequenceString = nextSequence.toString().padStart(5, '0');
    return `${datePrefix}${sequenceString}`;
}


export async function upsertSaleTransaction(
  sale: Partial<Omit<Sale, 'id'>>, 
  items: Omit<SalesItem, 'id' | 'salesTransactionId'>[]
): Promise<{ success: boolean; error?: string; saleId?: string }> {
  const { firestore } = await getAdminServices();

  try {
    return await firestore.runTransaction(async (transaction) => {
      let saleRef;
      let saleId = sale.id;
      
      if (saleId) {
        // UPDATE LOGIC
        saleRef = firestore.collection('sales_transactions').doc(saleId);
        
        // --- ALL READS FIRST ---
        const oldSaleDoc = await transaction.get(saleRef);
        if (!oldSaleDoc.exists) {
          throw new Error("Đơn hàng không tồn tại.");
        }
        const oldSaleData = oldSaleDoc.data() as Sale;

        const oldItemsQuery = saleRef.collection('sales_items');
        const oldItemsSnapshot = await transaction.get(oldItemsQuery);

        let oldPaymentDoc: FirebaseFirestore.DocumentSnapshot | undefined;
        if (oldSaleData.customerId && oldSaleData.customerPayment && oldSaleData.customerPayment > 0) {
          const paymentNote = `Thanh toán cho đơn hàng ${oldSaleData.id}`;
          const paymentsQuery = firestore.collection('payments')
            .where('customerId', '==', oldSaleData.customerId)
            .where('notes', '==', paymentNote)
            .limit(1);
          const oldPaymentsSnapshot = await transaction.get(paymentsQuery);
          if (!oldPaymentsSnapshot.empty) {
            oldPaymentDoc = oldPaymentsSnapshot.docs[0];
          }
        }
        
        // --- ALL WRITES SECOND ---
        // Delete old items
        oldItemsSnapshot.docs.forEach(doc => transaction.delete(doc.ref));

        // Delete old payment
        if (oldPaymentDoc && oldPaymentDoc.exists) {
          transaction.delete(oldPaymentDoc.ref);
        }
        
      } else {
        // CREATE LOGIC
        saleId = await getNextSaleId(firestore, transaction);
        saleRef = firestore.collection('sales_transactions').doc(saleId);
      }

      // --- WRITES for both CREATE and UPDATE ---
      // Set/update the main sale document
      const saleDataWithId = { ...sale, id: saleId };
      transaction.set(saleRef, saleDataWithId);

      // Create the new sales_item documents
      const saleItemsCollection = saleRef.collection('sales_items');
      for (const item of items) {
        const saleItemRef = saleItemsCollection.doc(); // Firestore auto-generates ID for items
        transaction.set(saleItemRef, { 
          ...item, 
          id: saleItemRef.id,
          salesTransactionId: saleId 
        });
      }
      
      // Create a new payment document if customerPayment is provided
      if (sale.customerPayment && sale.customerPayment > 0 && sale.customerId) {
        const paymentRef = firestore.collection('payments').doc();
        transaction.set(paymentRef, {
            id: paymentRef.id,
            customerId: sale.customerId,
            paymentDate: sale.transactionDate,
            amount: sale.customerPayment,
            notes: `Thanh toán cho đơn hàng ${saleId}`
        });
      }

      return { success: true, saleId: saleId };
    });
  } catch (error: any) {
    console.error("Error creating or updating sale transaction:", error);
    return { success: false, error: error.message || 'Không thể tạo hoặc cập nhật đơn hàng.' };
  }
}


export async function deleteSaleTransaction(saleId: string): Promise<{ success: boolean; error?: string }> {
  const { firestore } = await getAdminServices();
  const saleRef = firestore.collection('sales_transactions').doc(saleId);

  try {
    return await firestore.runTransaction(async (transaction) => {
      // 1. Get the sale document
      const saleDoc = await transaction.get(saleRef);
      if (!saleDoc.exists) {
        throw new Error("Đơn hàng không tồn tại.");
      }
      const saleData = saleDoc.data() as Sale;

      // 2. Delete all items in the sales_items subcollection
      const itemsQuery = saleRef.collection('sales_items');
      const itemsSnapshot = await transaction.get(itemsQuery);
      itemsSnapshot.docs.forEach(doc => transaction.delete(doc.ref));

      // 3. Find and delete the associated payment, if it exists
      if (saleData.customerId && saleData.customerPayment && saleData.customerPayment > 0) {
        const paymentNote = `Thanh toán cho đơn hàng ${saleId}`;
        const paymentsQuery = firestore.collection('payments')
            .where('customerId', '==', saleData.customerId)
            .where('notes', '==', paymentNote);
        
        const paymentsSnapshot = await transaction.get(paymentsQuery);
        // Assuming the note is unique enough, delete the first one found.
        if (!paymentsSnapshot.empty) {
          transaction.delete(paymentsSnapshot.docs[0].ref);
        }
      }

      // 4. Delete the main sale document
      transaction.delete(saleRef);

      return { success: true };
    });
  } catch (error: any) {
    console.error("Error deleting sale transaction:", error);
    return { success: false, error: error.message || 'Không thể xóa đơn hàng.' };
  }
}
