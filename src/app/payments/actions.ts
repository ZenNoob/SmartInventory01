'use server'

import { Payment, Customer, LoyaltySettings } from "@/lib/types";
import { getAdminServices } from "@/lib/admin-actions";
import { FieldValue } from "firebase-admin/firestore";


async function updateLoyaltyOnPayment(
  transaction: FirebaseFirestore.Transaction,
  firestore: FirebaseFirestore.Firestore,
  customerId: string,
  paymentAmount: number,
) {
  if (customerId === 'walk-in-customer') return;

  const settingsDoc = await transaction.get(firestore.collection('settings').doc('theme'));
  const loyaltySettings = settingsDoc.data()?.loyalty as LoyaltySettings | undefined;

  // Do nothing if loyalty program is not configured
  if (!loyaltySettings || !loyaltySettings.pointsPerAmount || loyaltySettings.pointsPerAmount <= 0) {
    return;
  }

  const customerRef = firestore.collection('customers').doc(customerId);
  const customerDoc = await transaction.get(customerRef);

  if (!customerDoc.exists) {
    console.warn(`Customer ${customerId} not found for loyalty update.`);
    return;
  }

  const customerData = customerDoc.data() as Customer;
  
  // Calculate points earned from this specific payment
  const earnedPoints = Math.floor(paymentAmount / loyaltySettings.pointsPerAmount);
  
  if (earnedPoints <= 0) {
    return; // No points earned for this payment, no update needed.
  }

  const currentSpendablePoints = customerData.loyaltyPoints || 0;
  const currentLifetimePoints = customerData.lifetimePoints || 0;

  // Add new points
  const newSpendablePoints = currentSpendablePoints + earnedPoints;
  const newLifetimePoints = currentLifetimePoints + earnedPoints;
  
  // Determine new tier based on lifetime points
  const sortedTiers = loyaltySettings.tiers.sort((a, b) => b.threshold - a.threshold);
  const newTier = sortedTiers.find(tier => newLifetimePoints >= tier.threshold);
  const newTierName = newTier?.name || undefined;

  const loyaltyUpdate: { 
    loyaltyPoints: number; 
    lifetimePoints: number;
    loyaltyTier?: Customer['loyaltyTier'] | FieldValue;
  } = {
    loyaltyPoints: newSpendablePoints,
    lifetimePoints: newLifetimePoints,
  };

  if (newTierName !== customerData.loyaltyTier) {
    loyaltyUpdate.loyaltyTier = newTierName || FieldValue.delete();
  }

  transaction.update(customerRef, loyaltyUpdate);
}


export async function addPayment(
    paymentData: Omit<Payment, 'id'>
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
    const { firestore } = await getAdminServices();

    try {
       const paymentId = await firestore.runTransaction(async (transaction) => {
            const paymentRef = firestore.collection('payments').doc();
            const newPayment = {
                ...paymentData,
                id: paymentRef.id,
            };
            transaction.set(paymentRef, newPayment);

            // After recording the payment, update the customer's loyalty points
            await updateLoyaltyOnPayment(transaction, firestore, paymentData.customerId, paymentData.amount);
            
            return paymentRef.id;
        });

        return { success: true, paymentId };
    } catch (error: any) {
        console.error("Error adding payment and updating loyalty:", error);
        return { success: false, error: error.message || 'Không thể ghi nhận thanh toán.' };
    }
}
