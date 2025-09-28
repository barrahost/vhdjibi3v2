import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import toast from 'react-hot-toast';

/**
 * Service for interacting with Firebase Cloud Functions
 */
export class CloudFunctionsService {
  /**
   * Calls the resetUserPassword Cloud Function to change a user's password
   * @param uid The user ID whose password to reset
   * @param newPassword The new password to set
   * @param isSelfReset Whether this is a self-service password reset
   * @param currentPassword The current password (required for self-service reset)
   * @returns Promise that resolves when the password has been reset
   */
  static async resetUserPassword(uid: string, newPassword: string, isSelfReset = false, currentPassword?: string): Promise<void> {
    try {
      const resetPasswordFn = httpsCallable(functions, 'resetUserPassword');
      
      const result = await resetPasswordFn({
        uid,
        newPassword,
        isSelfReset,
        currentPassword
      });
      
      return result.data as any;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
}