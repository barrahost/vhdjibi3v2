import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

interface ResetPasswordData {
  uid: string;
  newPassword: string;
  isSelfReset?: boolean;
  currentPassword?: string;
}

export const resetUserPassword = functions.https.onCall(async (data: ResetPasswordData, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to reset password'
    );
  }

  const { uid, newPassword, isSelfReset } = data;

  if (!uid || !newPassword) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'uid and newPassword are required'
    );
  }

  try {
    // Get the calling user's information
    const callingUserUid = context.auth.uid;
    
    // Check user role from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .where('uid', '==', callingUserUid)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    let isAdmin = false;
    
    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      // Legacy role field
      isAdmin = userData.role === 'admin' ||
                userData.role === 'pasteur' ||
                userData.role === 'super_admin';

      // New system: businessProfiles[] array
      if (!isAdmin && Array.isArray(userData.businessProfiles)) {
        isAdmin = userData.businessProfiles.some((p: any) =>
          p && (p.type === 'admin' || p.type === 'super_admin') && p.isActive !== false
        );
      }
    }

    // Check admins collection if not admin in users
    if (!isAdmin) {
      const adminDoc = await admin.firestore()
        .collection('admins')
        .where('uid', '==', callingUserUid)
        .where('role', '==', 'super_admin')
        .limit(1)
        .get();
      
      if (!adminDoc.empty) {
        isAdmin = true;
      }
    }

    // Case 1: User is trying to reset their own password
    if (isSelfReset) {
      if (callingUserUid !== uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Cannot reset another user\'s password'
        );
      }
    } 
    // Case 2: Admin is resetting someone else's password
    else if (!isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can reset other users\' passwords'
      );
    }

    // Update the user's password
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    return { 
      success: true, 
      message: 'Password updated successfully' 
    };

  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new functions.https.HttpsError(
      'internal',
      error?.message || 'Internal server error'
    );
  }
});
