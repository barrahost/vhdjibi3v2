import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Service for password operations.
 *
 * The app uses a custom Firestore-based auth system: `AuthContext.login`
 * validates the typed password against the `password` field on each user
 * document. We therefore update that field directly from the client and
 * bypass the Firebase Cloud Function (which is not auto-deployed here).
 */
export class CloudFunctionsService {
  static async resetUserPassword(
    uid: string,
    newPassword: string,
    isSelfReset = false,
    currentPassword?: string
  ): Promise<{ success: true }> {
    if (!uid || !newPassword) {
      throw new Error('Identifiant utilisateur et nouveau mot de passe requis');
    }

    if (newPassword.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    const savedUserRaw = localStorage.getItem('user');
    const callerUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

    if (!callerUser) {
      throw new Error('Vous devez être connecté pour effectuer cette action');
    }

    if (!isSelfReset) {
      const isAdmin =
        callerUser.role === 'admin' ||
        callerUser.role === 'super_admin' ||
        callerUser.role === 'pasteur' ||
        (Array.isArray(callerUser.businessProfiles) &&
          callerUser.businessProfiles.some(
            (p: any) =>
              p &&
              (p.type === 'admin' || p.type === 'super_admin') &&
              p.isActive !== false
          ));

      if (!isAdmin) {
        throw new Error(
          "Seuls les administrateurs peuvent réinitialiser le mot de passe d'un autre utilisateur"
        );
      }
    } else if (callerUser.uid !== uid) {
      throw new Error(
        "Vous ne pouvez pas réinitialiser le mot de passe d'un autre utilisateur"
      );
    }

    // Find the target document in `users`, then fall back to `admins`
    let docId: string | null = null;
    let collectionName: 'users' | 'admins' = 'users';
    let targetData: any = null;

    const usersSnap = await getDocs(
      query(collection(db, 'users'), where('uid', '==', uid))
    );
    if (!usersSnap.empty) {
      docId = usersSnap.docs[0].id;
      targetData = usersSnap.docs[0].data();
    } else {
      const adminsSnap = await getDocs(
        query(collection(db, 'admins'), where('uid', '==', uid))
      );
      if (!adminsSnap.empty) {
        docId = adminsSnap.docs[0].id;
        collectionName = 'admins';
        targetData = adminsSnap.docs[0].data();
      }
    }

    if (!docId || !targetData) {
      throw new Error('Utilisateur introuvable');
    }

    if (isSelfReset && targetData.password && currentPassword !== targetData.password) {
      throw new Error('Mot de passe actuel incorrect');
    }

    await updateDoc(doc(db, collectionName, docId), {
      password: newPassword,
      updatedAt: new Date(),
    });

    return { success: true };
  }
}
