'use server'

import { AppUser } from "@/lib/types";
import { initializeFirebase } from "@/firebase";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// This is an admin action, so we use firebase-admin
async function getAdminServices() {
    const { firebaseApp } = initializeFirebase();
    // Dynamically import admin SDKs only when needed
    const { getAuth } = await import('firebase-admin/auth');
    const { getFirestore } = await import('firebase-admin/firestore');
    return { auth: getAuth(firebaseApp), firestore: getFirestore(firebaseApp) };
}


export async function upsertUser(user: AppUser & { password?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const { auth, firestore } = await getAdminServices();

    if (user.id) {
      // Update existing user
      await auth.updateUser(user.id, {
        email: user.email,
        displayName: user.displayName,
      });
      await firestore.collection('users').doc(user.id).set({
        role: user.role,
        displayName: user.displayName,
        email: user.email,
      }, { merge: true });

    } else {
      // Create new user
      if (!user.password) {
        return { success: false, error: "Mật khẩu là bắt buộc cho người dùng mới." };
      }
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
      await firestore.collection('users').doc(userRecord.uid).set({
        role: user.role,
        displayName: user.displayName,
        email: user.email,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error upserting user:", error);
    return { success: false, error: error.message || 'Không thể tạo hoặc cập nhật người dùng.' };
  }
}
