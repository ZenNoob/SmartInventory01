

'use server'

import { AppUser, Permissions } from "@/lib/types";
import { getAdminServices } from "@/lib/admin-actions";
import { FieldValue } from "firebase-admin/firestore";

export async function upsertUser(user: Partial<Omit<AppUser, 'id'>> & { id?: string; password?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const { auth, firestore } = await getAdminServices();

    const userDataForDb: Partial<AppUser> = {
        ...(user.email && { email: user.email }),
        ...(user.displayName && { displayName: user.displayName }),
        ...(user.role && { role: user.role }),
        ...(user.permissions && { permissions: user.permissions }),
    };

    if (user.id) {
      // Update existing user
      await auth.updateUser(user.id, {
        ...(user.email && { email: user.email }),
        ...(user.displayName && { displayName: user.displayName }),
        ...(user.password && { password: user.password }),
      });
      await firestore.collection('users').doc(user.id).set(userDataForDb, { merge: true });

    } else {
      // Create new user
      if (!user.password) {
        return { success: false, error: "Mật khẩu là bắt buộc cho người dùng mới." };
      }
      if (!user.email) {
        return { success: false, error: "Email là bắt buộc cho người dùng mới." };
      }
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
      await firestore.collection('users').doc(userRecord.uid).set({ id: userRecord.uid, ...userDataForDb });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error upserting user:", error);
    return { success: false, error: error.message || 'Không thể tạo hoặc cập nhật người dùng.' };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { auth, firestore } = await getAdminServices();
        
        await auth.deleteUser(userId);
        await firestore.collection('users').doc(userId).delete();
        
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: error.message || 'Không thể xóa người dùng.' };
    }
}
