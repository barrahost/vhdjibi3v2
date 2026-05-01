## Permettre à un utilisateur de basculer entre plusieurs profils/rôles

### Constat

L'infrastructure multi-profils existe déjà partiellement :
- `BusinessProfile[]` est stocké sur l'utilisateur (Berger, Resp. Département, Resp. Famille, ADN, Admin)
- `BusinessProfileAssignment` permet déjà de cocher plusieurs profils à la création/édition
- `AuthContext.switchToProfile()` met à jour le profil actif et ses permissions
- `ProfileSwitcher` est affiché dans le `Header`

Mais **plusieurs problèmes empêchent un usage correct** quand un utilisateur a plusieurs casquettes :

1. **Le menu de gauche ne se met pas à jour** au changement de profil. Dans `Navigation.tsx`, des conditions comme `activeRole === SHEPHERD || userRole === SHEPHERD` font que les menus du rôle "principal" restent toujours visibles, peu importe le profil actif.
2. **Le `Dashboard` ne route pas dynamiquement** selon `activeRole` — il se base sur `userRole` (rôle principal stocké).
3. **Le contexte "départment / famille" n'est pas géré** lors du switch : si une personne est responsable de 2 départements ou d'une famille ET berger, on ne sait pas quel `departmentId` / `serviceFamilyId` est actif.
4. **Le profil actif n'est pas restauré au rechargement** correctement : le `useEffect` initial choisit shepherd en priorité au lieu du dernier profil utilisé.
5. **Le `ProfileSwitcher` est masqué pour le super_admin** (pas de `businessProfiles`), ce qui est ok, mais **il ne s'affiche pas non plus si l'utilisateur a un seul `businessProfile`** alors qu'on veut au minimum afficher l'identité du profil courant. Cas mineur.
6. **Le label "Profils disponibles" est correct** mais il manque un indicateur visuel clair sur le badge utilisateur du Header (le rôle affiché est encore basé sur `activeRole || userRole` mais ne couvre pas `department_leader` / `family_leader`).

### Objectif

Une personne connectée doit pouvoir, depuis le `ProfileSwitcher` du Header, basculer instantanément entre TOUS ses profils métier. Le menu, le tableau de bord, les permissions et le contexte (département/famille actif) doivent suivre.

### Étapes d'implémentation

#### 1. Corriger la sélection du profil actif au login & au reload (`AuthContext.tsx`)
- Persister `activeProfileType` dans `localStorage` à chaque `switchToProfile`.
- Au reload (`useEffect` initial) et au login : restaurer `activeProfileType` sauvegardé s'il existe et fait partie des profils disponibles ; sinon prendre le premier profil de la liste (ordre conservé tel que défini par l'admin), pas forcément `shepherd`.
- Marquer un seul profil comme `isActive: true` à la fois (cohérent avec `switchToProfile`).

#### 2. Rendre le menu réactif à `activeRole` uniquement (`src/components/ui/Navigation.tsx`)
- Remplacer toutes les conditions `activeRole === X || userRole === X` par `activeRole === X`.
- Le `userRole` (rôle "racine" stocké) ne doit plus piloter l'affichage du menu : seul le profil **actuellement sélectionné** compte.
- Vérifier que les permissions (`hasPermission`) sont bien recalculées par `usePermissions` à chaque changement de `permissions` dans le contexte (déjà le cas via `useAuth`).

#### 3. Router le tableau de bord selon le profil actif (`src/pages/Dashboard.tsx`)
- Utiliser `activeRole` (et non `userRole`) pour décider quel dashboard afficher : `ShepherdDashboard`, `DepartmentLeaderDashboard`, `FamilyLeaderDashboard`, dashboard ADN/Admin.
- Si l'utilisateur a plusieurs profils, le dashboard suit le switch sans rechargement.

#### 4. Gérer le contexte département / famille actif
- Étendre `BusinessProfile` (déjà présent) pour bien exploiter `departmentId` / `serviceFamilyId` lors du switch.
- Dans `AuthContext.switchToProfile`, exposer un `activeContext: { departmentId?, serviceFamilyId? }` dérivé du profil sélectionné.
- Si un utilisateur est responsable de **plusieurs départements** : ajouter un sous-sélecteur (étape ultérieure) ; pour cette itération, on suppose un département / une famille par profil (ce qui correspond au modèle actuel).

#### 5. Améliorer le `ProfileSwitcher` (`src/components/ui/ProfileSwitcher.tsx`)
- Afficher la liste de TOUS les profils (déjà ok), mettre en évidence l'actif via un check, conserver les libellés et descriptions.
- Ajouter une icône `family_leader` (actuellement non gérée dans le `switch` des icônes).
- Toaster "Profil basculé vers X" (déjà fait dans `AuthContext`).
- S'assurer que le composant est visible pour TOUT utilisateur ayant ≥ 2 `businessProfiles` (cas déjà géré, vérifier).

#### 6. Mettre à jour le label du Header (`src/components/ui/Header.tsx`)
- Compléter `getRoleLabel()` pour inclure `department_leader` et `family_leader`.
- Afficher le profil actif (pas le rôle stocké) dans la pastille sous le nom.

#### 7. Backfill / migration légère
- Pour les utilisateurs existants n'ayant que `role` (sans `businessProfiles`), `AuthContext` doit déjà construire un `businessProfiles` virtuel à la volée — vérifier que c'est le cas et le compléter si besoin pour que le `ProfileSwitcher` apparaisse dès qu'on coche plusieurs profils dans `BusinessProfileAssignment`.

#### 8. Changelog & version
- Ajouter une entrée dans le CHANGELOG ("Multi-profils : bascule complète entre rôles depuis le header") et bumper le numéro de version affiché dans le header.

### Fichiers impactés

- `src/contexts/AuthContext.tsx` — persistance `activeProfileType`, restauration au reload, exposition du contexte actif
- `src/components/ui/Navigation.tsx` — conditions basées uniquement sur `activeRole`
- `src/pages/Dashboard.tsx` — routing dashboard selon `activeRole`
- `src/components/ui/ProfileSwitcher.tsx` — icône `family_leader`, polish
- `src/components/ui/Header.tsx` — labels complets pour tous les profils
- `src/types/businessProfile.types.ts` — éventuelle exposition de `getActiveProfileContext` helper
- `CHANGELOG.md` + composant version dans le header

### Hors-scope (pour itération future)

- Sélection multi-département quand un utilisateur dirige plusieurs départements (UI dédiée)
- Cumul de permissions multi-profils simultanés (actuellement on bascule entre profils, on ne les cumule pas)
- Audit trail des changements de profil

### Points techniques

- `switchToProfile` recalcule déjà `permissions` via `getProfilePermissions(profileType)` — toute la chaîne `usePermissions` réagit donc automatiquement.
- Aucune migration Firebase nécessaire : le champ `businessProfiles` existe déjà sur les utilisateurs.
- `super_admin` reste un cas spécial (pas de `businessProfiles`, accès `*` direct) — le `ProfileSwitcher` reste masqué pour lui, ce qui est le comportement souhaité.
