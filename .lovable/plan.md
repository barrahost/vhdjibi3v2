
# Plan d'implémentation — Évolutions ADN & Familles de Service

Implémentation en 5 étapes selon l'ordre suggéré dans le brief. Chaque étape est livrable et testable indépendamment.

---

## ÉTAPE 1 — Mise à jour des types & rôles

**Objectif :** poser les fondations TypeScript avant tout changement UI.

### Fichiers modifiés

**`src/types/database.types.ts`**
- Ajouter à l'interface `Soul` :
  - `originSource?: 'culte' | 'evangelisation'` (optionnel pour compat. avec données existantes, mais marqué obligatoire dans l'UI)
  - `serviceFamilyId?: string`
- Ajouter une nouvelle interface `ServiceFamily` :
  ```ts
  export interface ServiceFamily {
    id: string;
    name: string;
    description?: string;
    leader?: string;        // legacy texte (compat)
    leaderId?: string;      // nouvelle référence user
    shepherdIds?: string[]; // nouveaux bergers
    order: number;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
  }
  ```

**`src/constants/roles.ts`**
- Ajouter `FAMILY_LEADER: 'family_leader'` dans `ROLES`
- Ajouter le bloc de permissions `[ROLES.FAMILY_LEADER]` dans `ROLE_PERMISSIONS` :
  ```
  MANAGE_SOULS, MANAGE_INTERACTIONS, MANAGE_PROFILE,
  MANAGE_SMS, VIEW_REPLAY_TEACHINGS
  ```

**`src/types/permission.types.ts`**
- Ajouter `'family_leader'` dans le type `BaseRole`.

**`src/types/businessProfile.types.ts`**
- Ajouter `'family_leader'` dans `BusinessProfileType`
- Ajouter labels, descriptions et permissions dans `PROFILE_PERMISSIONS`

**`src/contexts/AuthContext.tsx`**
- Ajouter `case 'family_leader': return 'Responsable de Famille'` dans `getRoleLabel`.

---

## ÉTAPE 2 — Formulaire d'enregistrement d'âme (ADN)

**Objectif :** ADN saisit la provenance et choisit une famille (au lieu d'un berger).

### Fichiers modifiés

**`src/components/souls/tabs/GeneralInfoTab.tsx`**
- Étendre l'interface `data` props avec `originSource` et `serviceFamilyId`
- Ajouter un bloc radio « Provenance de l'âme * » avec 2 options : `Culte` / `Campagne d'évangélisation`
- Ajouter un `<select>` « Famille de service » chargé via `useEffect` depuis la collection Firestore `serviceFamilies` (status = active)
- Conserver le `ShepherdSelect` mais :
  - L'afficher uniquement si l'utilisateur n'est pas ADN (admins peuvent toujours assigner)
  - Pour ADN → masquer ou désactiver, avec note explicative

**`src/components/souls/SoulForm.tsx`**
- Ajouter `originSource: ''` et `serviceFamilyId: undefined` dans `formData.general` (état initial + reset)
- Validation : `originSource` obligatoire avant submit
- Inclure les deux champs dans l'objet `soulData` envoyé à Firestore

**`src/components/souls/EditSoulModal.tsx`** (à inspecter rapidement)
- Pré-remplir les nouveaux champs à l'édition + sauvegarder

**Nouveau hook `src/hooks/useServiceFamilies.ts`** (mutualisable)
- Retourne la liste des familles actives, utilisable dans GeneralInfoTab et le futur Dashboard.

---

## ÉTAPE 3 — Formulaire des Familles de Service

**Objectif :** lier les familles à des utilisateurs réels (responsable + bergers).

### Fichiers modifiés

**`src/components/serviceFamilies/ServiceFamilyForm.tsx`**
- Remplacer l'input texte « Chef de famille » par un `<select>` listant les utilisateurs ayant le profil métier `family_leader` ou `shepherd` (chargé depuis `users`)
- Ajouter un multi-select « Bergers de la famille » listant les utilisateurs avec profil `shepherd`
  - Composant simple basé sur des checkboxes ou `MultiSelect` shadcn
- Sauvegarde : remplacer `leader` par `leaderId` + `shepherdIds: string[]`
- Conserver `leader` (texte) pour rétro-compatibilité jusqu'à la migration

**`src/components/serviceFamilies/EditServiceFamilyModal.tsx`**
- Mêmes modifications que `ServiceFamilyForm`
- Pré-remplissage : si `leaderId` absent mais `leader` présent → afficher en mode legacy

**`src/components/serviceFamilies/ServiceFamilyListItem.tsx`** (à inspecter)
- Afficher le nom du responsable depuis `leaderId` (lookup user) au lieu du texte brut

**Nouveau hook `src/hooks/useUsersByProfile.ts`**
- Retourne la liste filtrée des utilisateurs par type de profil métier.

---

## ÉTAPE 4 — Rôle `family_leader` (intégration complète)

**Objectif :** rendre le rôle utilisable (assignation, login, menus, navigation).

### Fichiers modifiés

**`src/components/users/BusinessProfileAssignment.tsx`**
- Ajouter le profil `family_leader` dans la liste des profils sélectionnables lors de la création/édition d'un utilisateur.

**`src/constants/auth.ts`**
- Ajouter un mot de passe par défaut pour `family_leader` (ex : `@123456`).

**`src/contexts/AuthContext.tsx`**
- Dans la fonction `login`, gérer la validation du mot de passe pour le profil `family_leader`.

**`src/components/users/UserForm.tsx`**
- Inclure `family_leader` dans la logique `updatePasswordForProfiles`.

**`src/components/ui/Navigation.tsx` / `AccordionMenu.tsx`** (à inspecter)
- Ajouter un menu visible pour `family_leader` (« Mes âmes de famille »).

**`src/components/auth/PrivateRoute.tsx`**
- Ajouter la redirection par défaut pour `family_leader` → `/family-souls` (ou dashboard).

---

## ÉTAPE 5 — Dashboard Responsable de Famille

**Objectif :** permettre au responsable de voir ses âmes et d'assigner un berger.

### Fichiers créés / modifiés

**Nouveau `src/components/dashboard/FamilyLeaderDashboard.tsx`**
Sections :
1. **En-tête** : nom de la famille du responsable
2. **Statistiques** : total âmes, assignées / non assignées, répartition par berger
3. **Liste des âmes de la famille** (filtre `serviceFamilyId === famille du user`) :
   - Colonnes : Nom, Provenance, Date 1ère visite, Berger assigné, Action
   - Pour chaque âme non assignée → `<select>` listant uniquement les `shepherdIds` de la famille + bouton « Assigner »
   - Pour les âmes déjà assignées → possibilité de réassigner

**Nouveau service `src/services/familyLeader.service.ts`**
- `getFamilyByLeaderId(userId)` → retourne la `ServiceFamily`
- `getSoulsByFamilyId(familyId)` → liste des âmes
- `assignShepherdToSoul(soulId, shepherdId)` → met à jour `souls/{id}.shepherdId`
- `getShepherdsOfFamily(familyId)` → utilisateurs `shepherd` listés dans `shepherdIds`

**`src/pages/Dashboard.tsx`**
- Ajouter `case 'family_leader': return <FamilyLeaderDashboard />`

**Nouvelle page (optionnelle) `src/pages/FamilySouls.tsx`**
- Vue détaillée des âmes de la famille avec filtres, accessible depuis le menu.

**`src/App.tsx`**
- Ajouter la route `/family-souls` protégée par `PrivateRoute` avec permission `MANAGE_SOULS`.

---

## Récapitulatif des fichiers touchés

```text
TYPES & ROLES (Étape 1)
- src/types/database.types.ts
- src/types/permission.types.ts
- src/types/businessProfile.types.ts
- src/constants/roles.ts
- src/contexts/AuthContext.tsx

FORMULAIRE AME (Étape 2)
- src/components/souls/tabs/GeneralInfoTab.tsx
- src/components/souls/SoulForm.tsx
- src/components/souls/EditSoulModal.tsx
- src/hooks/useServiceFamilies.ts (nouveau)

FORMULAIRE FAMILLE (Étape 3)
- src/components/serviceFamilies/ServiceFamilyForm.tsx
- src/components/serviceFamilies/EditServiceFamilyModal.tsx
- src/components/serviceFamilies/ServiceFamilyListItem.tsx
- src/hooks/useUsersByProfile.ts (nouveau)

ROLE FAMILY_LEADER (Étape 4)
- src/components/users/BusinessProfileAssignment.tsx
- src/components/users/UserForm.tsx
- src/constants/auth.ts
- src/components/ui/Navigation.tsx
- src/components/auth/PrivateRoute.tsx

DASHBOARD (Étape 5)
- src/components/dashboard/FamilyLeaderDashboard.tsx (nouveau)
- src/services/familyLeader.service.ts (nouveau)
- src/pages/Dashboard.tsx
- src/pages/FamilySouls.tsx (nouveau, optionnel)
- src/App.tsx
```

---

## Notes techniques importantes

- **Backend** : ce projet utilise **Firebase Firestore** (pas Supabase). Aucune migration SQL requise — Firestore étant schemaless, les nouveaux champs sont ajoutés au moment de l'écriture. Les documents existants restent valides (champs nouveaux = `undefined`).
- **Compatibilité ascendante** : `leader` (texte) est conservé en lecture seule pour les anciennes familles. Affichage de fallback : `family.leaderId ? lookupUser(leaderId).fullName : family.leader`.
- **Sécurité** : la vérification "responsable d'une famille = peut voir uniquement ses âmes" se fait côté client (filtrage Firestore par `serviceFamilyId`). Pour renforcer, prévoir des **règles Firestore** dans une étape ultérieure si nécessaire.
- **Changelog** : à mettre à jour à la fin (CHANGELOG.md + version dans le header).

---

## Recommandation d'exécution

Je recommande de **livrer les étapes une par une** plutôt qu'en bloc, pour pouvoir tester chaque évolution :
1. Étape 1 (types) → invisible mais permet la suite
2. Étapes 2 + 3 → visibles immédiatement par ADN et admins
3. Étape 4 → permet de créer un user `family_leader`
4. Étape 5 → rend le rôle réellement utile

Veux-tu que je commence par **toute l'étape 1 + 2** dans une seule itération ou préfères-tu un découpage différent ?
