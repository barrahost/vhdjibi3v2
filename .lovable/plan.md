## Problème identifié

L'application utilise **deux systèmes de rôles en parallèle** :
1. **Legacy** : champ unique `role` (ex: `'shepherd'`, `'intern'`, `'adn'`...)
2. **Nouveau** : tableau `businessProfiles[]` permettant **plusieurs casquettes**

Beaucoup de filtres et requêtes n'interrogent que le champ legacy `role`, ce qui **exclut les utilisateurs multi-casquettes** (ex : un Resp. Département promu Berger, ou un Berger devenu ADN garde son `role` initial mais reçoit un nouveau `businessProfile`).

Sur la capture, tous les bergers visibles sont d'anciens bergers "purs". Les bergers récents (multi-casquettes) sont absents.

## Fichiers à corriger

Détection unifiée à appliquer partout :
```ts
const isShepherd = 
  user.role === 'shepherd' || 
  user.role === 'intern' ||
  user.businessProfiles?.some(p => 
    ['shepherd','intern'].includes(p.type) && p.isActive !== false
  );
```

### 1. Filtres / sélecteurs de bergers (priorité haute)

| Fichier | Problème |
|---|---|
| `src/components/users/UserList.tsx` (l. 264) | Filtre "Berger(e)s" : `user.role === 'shepherd'` seul → manque multi-casquettes et stagiaires |
| `src/pages/Reminders.tsx` (l. 27) | Charge bergers via `role == 'shepherd'` uniquement |
| `src/pages/ShepherdReminders.tsx` (l. 42) | Page "Rappels par berger" : idem |
| `src/components/map/SoulMap.tsx` (l. 101) | Carte des âmes : filtre berger incomplet |
| `src/components/dashboard/stats/GeneralStats.tsx` (l. 36) | Statistiques générales |
| `src/components/settings/UserMenuManagement.tsx` (l. 23) | Gestion menus utilisateurs |
| `src/migrations/servantSchemaChanges.ts` (l. 29) | Migration (à aligner) |

### 2. Identification de l'utilisateur courant comme berger

| Fichier | Problème |
|---|---|
| `src/pages/SMSManagement.tsx` (l. 36) | Berger connecté détecté via `role=='shepherd'` seul → un berger multi-casquettes voit "Test SMS" au lieu de ses âmes |
| `src/pages/InteractionsManagement.tsx` (l. 127) | Idem pour les interactions |
| `src/components/souls/EditSoulModal.tsx` (l. 56) | Récupération du `shepherdId` courant |

### 3. Filtre par rôle dans la liste utilisateurs

`src/components/users/UserList.tsx` (l. 260-267) — étendre :
- `'shepherds'` → inclure stagiaires + multi-casquettes
- `'admins'` → inclure `businessProfiles.type === 'admin'`
- `'adn'` → inclure `businessProfiles.type === 'adn'`
- Ajouter aussi : Resp. Département, Resp. Famille déjà filtrables ? Vérifier et étendre.

### 4. Stratégie technique

Pour les requêtes Firestore qui filtrent sur `role`, il n'est pas possible de faire un `OR` natif sur deux champs. Solution adoptée (déjà en place dans `ShepherdSelect.tsx` et `BatchAssignmentModal.tsx` v1.7.63) :
- **Charger tous les utilisateurs actifs** (`status == 'active'`)
- **Filtrer côté client** avec la logique hybride

### 5. Helpers à créer

Créer `src/utils/roleHelpers.ts` exportant :
```ts
export const isShepherdUser(user): boolean
export const isInternUser(user): boolean
export const isADNUser(user): boolean
export const isAdminUser(user): boolean
export const isDepartmentLeaderUser(user): boolean
export const isFamilyLeaderUser(user): boolean
export const hasAnyRole(user, roles[]): boolean
```

→ Refactoriser tous les fichiers listés pour utiliser ces helpers (cohérence + maintenance).

### 6. Maintenance

- Bumper version → **1.7.65**
- Mettre à jour `src/CHANGELOG.md` avec la liste des corrections
- Mettre à jour `src/pages/Login.tsx` (numéro de version affiché)

## Ce qui sera testable après

1. **Page Utilisateurs** → filtre "Berger(e)s" affichera **tous** les bergers (purs + multi-casquettes + stagiaires).
2. **Filtres berger** sur Âmes / Interactions / Carte / Rappels → liste complète.
3. **SMS / Interactions** → un berger ayant aussi ADN/Resp. accède bien à ses âmes assignées.
4. **Dashboard stats** → comptage correct des bergers actifs.

## Hors scope

- Ne touche pas à la logique de permissions (`usePermissions`) qui combine déjà les deux systèmes.
- Ne migre pas les données : les champs `role` legacy restent intacts.
- Ne modifie pas les Cloud Functions ni les règles Firestore.

Approuvez pour que j'implémente.