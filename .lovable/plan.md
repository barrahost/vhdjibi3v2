## Deux corrections sur la page Utilisateurs

### 1. Erreur « internal » à la réinitialisation du mot de passe

**Cause :** L'application appelle la Cloud Function Firebase `resetUserPassword`, mais les fonctions Firebase ne sont pas redéployées automatiquement dans cet environnement. La fonction tournant en production est encore l'ancienne version qui échoue avec `internal` parce que :
- elle exige un `context.auth` (que l'app, en auth personnalisée Firestore, ne fournit jamais),
- et elle appelle `admin.auth().updateUser(uid, ...)` sur des `uid` du type `user_xxx` qui n'existent pas dans Firebase Auth.

**Solution :** Contourner complètement la Cloud Function. Comme la connexion (`AuthContext.login`) valide désormais le champ `password` du document Firestore, on met à jour ce champ directement depuis le client.

Réécrire `src/services/cloudFunctions.service.ts` pour :
- vérifier côté client que l'appelant est admin (lecture du `localStorage`),
- pour une auto-réinitialisation, vérifier l'`uid` et le `currentPassword`,
- localiser le document de l'utilisateur cible (`users` puis `admins` par `uid`),
- mettre à jour `password` + `updatedAt` via `updateDoc`,
- renvoyer des messages d'erreur explicites (utilisateur introuvable, mot de passe actuel incorrect, permission refusée, mot de passe trop court).

Aucune dépendance à Firebase Functions n'est conservée pour cette fonctionnalité.

### 2. Filtre de rôles incomplet sur `/users`

**Cause :** Le `<select>` de filtre dans `src/pages/UserManagement.tsx` ne propose que 4 options (Tous, Administrateurs, Berger(e)s, ADN). Les profils métier `Responsable de Département`, `Responsable de Famille` et `Évangéliste` ne sont pas listés.

**Solution :**
- Étendre le type `roleFilter` à : `'all' | 'admins' | 'shepherds' | 'adn' | 'department_leader' | 'family_leader' | 'evangelist'`.
- Ajouter les trois options manquantes dans le `<select>`.
- Étendre `UserList` (`src/components/users/UserList.tsx`) pour gérer ces nouveaux filtres en utilisant les helpers `isDepartmentLeaderUser`, `isFamilyLeaderUser`, `isEvangelistUser` (déjà présents dans `src/utils/roleHelpers.ts`), qui couvrent à la fois le legacy `role` et les `businessProfiles`.

### 3. Maintenance

- Bumper la version `1.7.68` → `1.7.69` dans `src/pages/Login.tsx`.
- Ajouter une entrée dans `src/CHANGELOG.md` décrivant ces deux correctifs.

## Résultat attendu

- La réinitialisation du mot de passe fonctionne immédiatement (plus d'erreur « internal »), et le nouveau mot de passe est utilisable à la prochaine connexion.
- Le filtre de la page Utilisateurs liste tous les profils métier de l'application : Administrateurs, Berger(e)s, ADN, Responsables de Département, Responsables de Famille, Évangélistes.