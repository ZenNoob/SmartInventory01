'use server'

import { PurchaseOrder, PurchaseOrderItem, PurchaseLot } from "@/lib/types";
import { getAdminServices } from "@/lib/admin-actions";
import { FieldValue } from "firebase-admin/firestore";

async function getNextOrderNumber(firestore: FirebaseFirestore.Firestore, transaction: FirebaseFirestore.Transaction): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const datePrefix = `PN${year}${month}`;

    const collectionRef = firestore.collection('purchase_orders');
    const q = collectionRef
        .where('orderNumber', '>=', datePrefix)
        .where('orderNumber', '<', datePrefix + 'z')
        .orderBy('orderNumber', 'desc')
        .limit(1);

    const snapshot = await transaction.get(q);
    
    let nextSequence = 1;
    if (!snapshot.empty) {
        const lastId = snapshot.docs[0].data().orderNumber;
        const lastSequence = parseInt(lastId.substring(datePrefix.length), 10);
        nextSequence = lastSequence + 1;
    }

    const sequenceString = nextSequence.toString().padStart(4, '0');
    return `${datePrefix}${sequenceString}`;
}


export async function createPurchaseOrder(
  order: Omit<PurchaseOrder, 'id' | 'orderNumber'>
): Promise<{ success: boolean; error?: string; purchaseOrderId?: string }> {
  const { firestore } = await getAdminServices();

  try {
    const purchaseOrderId = await firestore.runTransaction(async (transaction) => {
      // 1. Generate a new order number
      const orderNumber = await getNextOrderNumber(firestore, transaction);
      
      // 2. Create the main purchase_orders document
      const purchaseOrderRef = firestore.collection('purchase_orders').doc();
      const newPurchaseOrder: PurchaseOrder = {
        ...order,
        id: purchaseOrderRef.id,
        orderNumber,
        createdAt: FieldValue.serverTimestamp(),
      };
      transaction.set(purchaseOrderRef, newPurchaseOrder);

      // 3. Create purchase_order_items subcollection and update product lots
      const itemsRef = purchaseOrderRef.collection('purchase_order_items');
      const productUpdatePromises: Promise<void>[] = [];

      for (const item of order.items) {
        const itemRef = itemsRef.doc();
        const newItem: PurchaseOrderItem = {
            ...item,
            id: itemRef.id,
            purchaseOrderId: purchaseOrderRef.id
        }
        transaction.set(itemRef, newItem);

        // Prepare to update the corresponding product's purchaseLots array
        const productRef = firestore.collection('products').doc(item.productId);
        const newPurchaseLot: PurchaseLot = {
            importDate: order.importDate,
            quantity: item.quantity,
            cost: item.cost,
            unitId: item.unitId
        };
        // Use arrayUnion to atomically add the new lot to the product
        transaction.update(productRef, {
            purchaseLots: FieldValue.arrayUnion(newPurchaseLot)
        });
      }

      return purchaseOrderRef.id;
    });

    return { success: true, purchaseOrderId };

  } catch (error: any) {
    console.error("Error creating purchase order:", error);
    return { success: false, error: error.message || 'Không thể tạo đơn nhập hàng.' };
  }
}
