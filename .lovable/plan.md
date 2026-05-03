## Plan de correction

Le message d’erreur indique que l’appel à la fonction `resetUserPassword` retourne encore `functions/internal`. En examinant le code, la cause probable est double :

1. L’application utilise surtout une authentification personnalisée basée sur les documents `users`/`admins`, alors que la fonction tente uniquement de modifier le mot de passe dans Firebase Auth avec `admin.auth().updateUser(uid, ...)`.
2. Certains utilisateurs ont un `uid` généré côté application (`user_...`) qui n’existe probablement pas dans Firebase Auth. Dans ce cas, `updateUser` échoue et la fonction renvoie une erreur interne.

## Changements proposés

### 1. Corriger la fonction backend `resetUserPassword`
Mettre à jour `functions/src/index.ts` pour que la réinitialisation fonctionne avec le système réel de l’application :

- Chercher l’utilisateur cible dans `users` par `uid`.
- S’il est trouvé, mettre aussi à jour son champ `password` dans Firestore avec le nouveau mot de passe.
- Ne tenter `admin.auth().updateUser(uid, { password })` que si nécessaire, et ne pas faire échouer toute l’opération si l’utilisateur n’existe pas dans Firebase Auth.
- Garder la vérification de permission admin existante, en incluant les profils métier `admin`/`super_admin`.
- Pour la réinitialisation personnelle (`isSelfReset`), vérifier le mot de passe actuel contre le document utilisateur avant de changer le mot de passe.
- Renvoyer des erreurs plus précises au frontend (`permission-denied`, `not-found`, `invalid-argument`) au lieu de transformer toutes les erreurs en `internal`.

### 2. Améliorer le message côté interface
Mettre à jour `src/services/cloudFunctions.service.ts` et/ou `PasswordResetModal.tsx` pour afficher un message plus explicite si le backend renvoie une erreur précise, par exemple :

- permission insuffisante,
- utilisateur introuvable,
- mot de passe actuel incorrect,
- erreur technique.

Cela évitera le message générique “Erreur lors de la réinitialisation du mot de passe” sans explication.

### 3. Harmoniser avec le système de connexion actuel
Vérifier que `AuthContext.tsx` compare bien le mot de passe saisi avec le champ `password` personnalisé lorsqu’il existe, afin que le nouveau mot de passe défini par l’administrateur soit réellement utilisable à la prochaine connexion.

Aujourd’hui, le login semble encore comparer uniquement aux mots de passe par défaut par profil (`@123456`). Si c’est confirmé, je modifierai la logique pour :

- accepter d’abord le mot de passe personnalisé stocké sur le document utilisateur,
- conserver les mots de passe par défaut comme compatibilité pour les anciens comptes sans mot de passe personnalisé.

### 4. Maintenance version/changelog
Comme demandé dans les consignes projet :

- incrémenter la version affichée dans `src/pages/Login.tsx`,
- ajouter une entrée dans `src/CHANGELOG.md` décrivant la correction de la réinitialisation des mots de passe.

## Résultat attendu

Après correction, depuis `/users`, un administrateur pourra réinitialiser le mot de passe d’un utilisateur comme `TKP`, et ce nouveau mot de passe sera utilisable pour la connexion, même si l’utilisateur n’existe pas dans Firebase Auth.