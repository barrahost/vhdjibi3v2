# Fix: Erreur lors de la réinitialisation du mot de passe

## Diagnostic

L'erreur survient lorsqu'un administrateur (notamment ceux configurés avec le nouveau système de **profils métier** — `businessProfiles[]`) tente de réinitialiser le mot de passe d'un autre utilisateur (ex. l'utilisateur "TKP" avec le profil Évangéliste).

La Cloud Function `resetUserPassword` (dans `functions/src/index.ts`) utilise encore l'ancien système et ne vérifie que le champ `userData.role` :

```ts
isAdmin = userData.role === 'admin' 
       || userData.role === 'pasteur' 
       || userData.role === 'super_admin';
```

Or, l'application front-end est passée au système `businessProfiles[]` (cf. `src/utils/roleHelpers.ts` → `isAdminUser`). Un admin qui n'a pas le champ legacy `role: 'admin'` mais possède un `businessProfile` de type `admin` actif est rejeté avec `permission-denied`, d'où le toast d'erreur.

Ce bug n'est pas lié à la fonctionnalité Évangéliste — il est simplement révélé en testant la création/édition d'un utilisateur avec ce nouveau profil.

## Correction proposée

### 1. `functions/src/index.ts` — élargir la détection admin

Ajouter la vérification du tableau `businessProfiles` en parallèle du champ legacy `role` :

```ts
if (!userDoc.empty) {
  const userData = userDoc.docs[0].data();

  // Legacy role
  isAdmin = userData.role === 'admin' 
         || userData.role === 'pasteur' 
         || userData.role === 'super_admin';

  // Nouveau système : businessProfiles[]
  if (!isAdmin && Array.isArray(userData.businessProfiles)) {
    isAdmin = userData.businessProfiles.some((p: any) =>
      p && (p.type === 'admin' || p.type === 'super_admin')
      && p.isActive !== false
    );
  }
}
```

La vérification dans la collection `admins` (super_admin) reste inchangée.

### 2. Versionnage

- Bump de version : `1.7.67` → `1.7.68`
- Mise à jour de `src/CHANGELOG.md` avec une entrée :
  *Correctif : la réinitialisation du mot de passe fonctionne désormais pour les administrateurs configurés via le nouveau système de profils métier.*

## Fichiers modifiés

- `functions/src/index.ts` (logique de détection admin)
- `src/CHANGELOG.md` (entrée changelog)
- Composant header affichant la version (bump 1.7.68)

## Hors périmètre

- Pas de modification du flux UI de réinitialisation (les composants `PasswordResetModal` et `SelfPasswordResetModal` restent identiques).
- Pas de migration de données : les deux systèmes (legacy `role` et `businessProfiles[]`) continuent de coexister.
