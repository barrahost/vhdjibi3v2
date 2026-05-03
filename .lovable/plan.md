## Problème

L'utilisateur TKP saisit le bon mot de passe mais reçoit "Numéro de téléphone ou mot de passe incorrect". Les logs confirment que l'utilisateur est bien trouvé dans Firestore (sinon : "User not found"), mais la comparaison de mot de passe échoue à la ligne 268 de `AuthContext.tsx`.

## Cause racine

Le service `resetUserPassword` (dans `src/services/cloudFunctions.service.ts`) cherche le document Firestore via :
```ts
where('uid', '==', uid)
```

Mais le login (`AuthContext.login`) cherche via :
```ts
where('phone', '==', formattedPhone) AND where('status', '==', 'active')
```

Quand un utilisateur a :
- un champ `uid` Firestore manquant ou différent du doc id, OU
- un doublon de document partageant le même `uid`,

…le reset met à jour **un autre document** que celui utilisé pour le login. Le toast affiche "succès" mais le password réel utilisé pour la connexion n'est jamais modifié.

De plus, la modal `PasswordResetModal` reçoit déjà `user.id` (le doc id Firestore exact). Il est donc inutile et risqué de re-chercher par `uid`.

## Solution

### 1. `src/services/cloudFunctions.service.ts`
- Changer la signature pour accepter aussi le doc id Firestore (paramètre `docId`) en plus du `uid`.
- En priorité, utiliser `getDoc(doc(db, 'users', docId))` puis fallback `admins`. Cibler exactement le document qui sera utilisé au login.
- Ne re-chercher par `uid` qu'en dernier recours pour les self-resets où le doc id n'est pas connu.

### 2. `src/components/users/PasswordResetModal.tsx`
- Passer `user.id` (doc id) au service en plus du `uid`.

### 3. `src/components/profile/SelfPasswordResetModal.tsx`
- Si on a accès au doc id de l'utilisateur courant via `localStorage.user.id`, le passer aussi.

### 4. `src/contexts/AuthContext.tsx`
- Renforcer la vérification de mot de passe : si `userData.password` existe et ne matche pas, **ne pas** retomber sur les mots de passe par défaut (sinon un mot de passe par défaut bypasserait un reset volontaire). Aujourd'hui le code passe déjà à `else if`, donc OK — mais ajouter un log clair indiquant la valeur stockée vs saisie (longueur uniquement, pas les valeurs en clair) pour diagnostiquer.
- Logger aussi le doc id trouvé au login pour faciliter le diagnostic en cas de doublon.

### 5. Maintenance
- Bump version `1.7.69` → `1.7.70` dans `src/pages/Login.tsx`.
- Mettre à jour `src/CHANGELOG.md`.

## Vérification post-implémentation

Les nouveaux logs au login afficheront le doc id, la présence du champ `password` stocké, et sa longueur — ce qui permettra de confirmer immédiatement si le reset a touché le bon document.
