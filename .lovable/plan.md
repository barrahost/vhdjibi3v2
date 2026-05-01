## Objectif

Permettre à un utilisateur multi-rôles de définir un **profil principal** (rôle de connexion par défaut) tout en conservant la possibilité de basculer ensuite. Nettoyer la page de login (pas de badge de rôle) et afficher la liste de tous les rôles dans la table de gestion des utilisateurs.

---

## 1. Modèle de données — `BusinessProfile`

**Fichier : `src/types/businessProfile.types.ts`**

- Ajouter un champ optionnel `isPrimary?: boolean` sur l'interface `BusinessProfile`.
- Règle métier : un seul profil peut avoir `isPrimary = true`. Si aucun n'est marqué, le premier de la liste fait office de défaut.

`isActive` reste utilisé pour indiquer le profil **actuellement** sélectionné dans la session ; `isPrimary` est la préférence persistée par l'utilisateur/admin.

---

## 2. Attribution du profil principal (Admin)

**Fichier : `src/components/users/BusinessProfileAssignment.tsx`**

Pour chaque profil coché, ajouter un radio bouton « Principal » à droite (groupe radio unique).
- Cocher un profil → s'il est seul, il devient automatiquement principal.
- Décocher le profil principal → bascule automatiquement le principal sur le premier restant.
- Visuel : étoile/badge « Profil principal » à côté du label.

La sauvegarde via `UserForm.tsx` / `EditUserModal.tsx` enregistre déjà `businessProfiles` dans Firestore — aucune modification supplémentaire requise (le champ `isPrimary` sera persisté tel quel).

---

## 3. Login par défaut sur le profil principal

**Fichier : `src/contexts/AuthContext.tsx`**

Dans `login()` (~ligne 326) et dans la restauration de session (~ligne 99), modifier la logique de sélection de `chosenProfile` selon cet ordre de priorité :

1. `localStorage.activeProfileType` s'il existe **ET** correspond à un profil disponible (permet de garder le dernier basculement effectué dans la session précédente).
2. Profil ayant `isPrimary === true`.
3. Profil ayant `isActive === true` (rétro-compat).
4. Premier profil de la liste.

Cas particulier à la **première connexion** (pas de `activeProfileType` en localStorage) → on force la sélection sur le profil principal, ignorant l'étape 1.

---

## 4. Login — suppression du badge de rôle

**Fichier : `src/components/auth/UserSelect.tsx`**

- Retirer l'affichage des `<span>` badges de rôle :
  - dans le bouton-trigger (lignes 242-244)
  - dans la liste déroulante (lignes 296-298)
- Supprimer les helpers `getRoleBadgeColor` et `getRoleDisplayName` devenus inutiles.
- Conserver `getUserType()` qui sert à `onChange`.

Résultat : le sélecteur n'affiche plus que **nom + téléphone**.

---

## 5. Liste des utilisateurs — colonne « Rôles »

**Fichier : `src/components/users/UserList.tsx`** (colonne `role`, lignes 365-405)

Remplacer le badge unique par une liste de badges :
- Si `user.businessProfiles` existe et n'est pas vide → afficher un badge par profil, en utilisant `BUSINESS_PROFILE_LABELS`. Marquer visuellement le profil principal (étoile ★ ou bordure dorée `#F2B636`).
- Sinon (rétro-compat) → afficher le badge unique basé sur `user.role` (comportement actuel).

Couleurs des badges réutilisées par mapping :
```
shepherd → vert | adn → ambre | admin/super_admin → bleu/violet
department_leader → indigo | family_leader → teal
```

Affichage compact : `flex flex-wrap gap-1` pour rester lisible sur mobile.

---

## 6. Detail technique — `ProfileSwitcher`

**Fichier : `src/components/ui/ProfileSwitcher.tsx`** (vérification, sans modification probable)

Le switcher continue d'utiliser `switchToProfile()`. Aucune modification fonctionnelle nécessaire ; on peut simplement ajouter un libellé « (principal) » à côté du profil principal dans la liste déroulante pour clarté.

---

## 7. Changelog & version

- `src/CHANGELOG.md` : entrée v1.7.23 — « Profil principal multi-rôles, nettoyage page de connexion, affichage des rôles multiples dans la gestion utilisateurs ».
- `src/pages/Login.tsx` (ligne ~106) : passer la version à `1.7.23`.

---

## Fichiers modifiés (récap)

1. `src/types/businessProfile.types.ts` — champ `isPrimary`
2. `src/components/users/BusinessProfileAssignment.tsx` — UI radio « Principal »
3. `src/contexts/AuthContext.tsx` — priorité `isPrimary` au login
4. `src/components/auth/UserSelect.tsx` — suppression badges rôle
5. `src/components/users/UserList.tsx` — colonne multi-badges
6. `src/components/ui/ProfileSwitcher.tsx` — mention « (principal) » (mineur)
7. `src/CHANGELOG.md` + `src/pages/Login.tsx` — version 1.7.23

---

## Points hors scope (à confirmer si souhaités)

- Permettre à l'utilisateur lui-même (non admin) de changer son profil principal depuis son profil → non inclus, à demander si besoin.
- Migration des utilisateurs existants pour marquer un `isPrimary` initial → la logique de fallback (étape 3-4 du §3) gère naturellement les anciens comptes ; aucune migration bloquante.
