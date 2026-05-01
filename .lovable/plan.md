## Objectif

Permettre à un **chef de département** d'ajouter des serviteurs à son département en les **important** depuis :

1. La liste des **âmes** existantes
2. La liste des **utilisateurs** existants (n'importe quel rôle : berger, chef de famille, ADN, autre chef de département, admin…)

Le serviteur reste **la même personne** que l'âme/utilisateur d'origine (lien conservé). Une personne peut être serviteur dans plusieurs départements simultanément.

---

## Concept clé : multi-appartenance

Aujourd'hui, la collection `servants` duplique nom/téléphone/email et lie au mieux à `originalSoulId`. Pour gérer **n'importe quelle source** (âme OU utilisateur) et **plusieurs départements** par personne, on étend le modèle :

```
Servant {
  // … champs existants
  sourceType?: 'soul' | 'user' | 'manual';   // origine de l'import
  sourceId?: string;                          // id de l'âme OU de l'utilisateur source
  originalSoulId?: string;                    // conservé pour rétro-compat (= sourceId si soul)
}
```

Règle : **l'unicité phone/email est levée** (un user/âme déjà serviteur ailleurs doit pouvoir rejoindre un autre département). On ajoute à la place une **unicité (sourceType, sourceId, departmentId)** vérifiée applicativement pour empêcher d'importer deux fois la même personne dans le même département.

---

## Étapes

### 1. Type & service serviteur

**`src/types/servant.types.ts`**
- Ajouter `sourceType?: 'soul' | 'user' | 'manual'` et `sourceId?: string`.
- Garder `originalSoulId` pour la rétro-compat.

**`src/services/servant.service.ts`**
- Nouvelle méthode `importFromSouls(soulIds, departmentId)` : pour chaque âme, vérifier qu'aucun doc serviteur `(sourceType='soul', sourceId, departmentId)` n'existe ; sinon créer un serviteur avec les infos copiées (fullName, gender, phone, email) + `sourceType='soul'`, `sourceId=soul.id`, `originalSoulId=soul.id`.
- Nouvelle méthode `importFromUsers(userIds, departmentId)` : idem avec `sourceType='user'`, `sourceId=user.id`. Récupérer fullName/phone/email depuis Firestore `users`.
- Modifier `createServant()` : remplacer les check d'unicité phone/email **globaux** par un check `(sourceType, sourceId, departmentId)` quand source fournie ; pour les ajouts manuels (sans source), conserver l'unicité phone par département uniquement.
- Retourne un résumé `{ imported, skipped: [{name, reason}] }`.

### 2. Composant d'import (modale)

**Nouveau : `src/components/servants/ImportServantsModal.tsx`**

Une modale avec :
- Onglets `Depuis les âmes` / `Depuis les utilisateurs`.
- Recherche (nom, téléphone) + liste paginée avec checkboxes.
- Filtres simples (par genre pour les âmes ; par rôle pour les utilisateurs).
- Indication visuelle « déjà serviteur dans ce département » → désactivé.
- Bouton « Importer (N) » qui appelle `importFromSouls` ou `importFromUsers` selon l'onglet.
- Toast résumé (`X importés, Y ignorés`).

Hooks utilisés :
- `useDepartments` pour le contexte ; pour un chef de département le `departmentId` est fixé (depuis `activeRole === 'department_leader'` et son `businessProfile`).
- Lecture directe des collections `souls` et `users` (queries Firestore avec pagination simple — 50 par page).

### 3. Intégration UI

**`src/pages/ServantManagement.tsx`** et **`src/components/servants/DepartmentLeaderDashboard.tsx`**
- Ajouter à côté de « Ajouter un serviteur » un bouton **« Importer des serviteurs »** (icône `Download` ou `UserPlus2`).
- Dans `DepartmentLeaderDashboard`, ajouter ce même bouton dans l'en-tête de la card « Serviteurs du département » (le département est connu).
- Dans `ServantManagement` (vue admin), demander de choisir un département cible si aucun n'est sélectionné dans le filtre.

### 4. Affichage de la source

**`src/components/servants/ServantListItem.tsx`** (et la liste du dashboard)
- Afficher un petit badge supplémentaire :
  - `Importé d'âme` (bleu) — si `sourceType='soul'`
  - `Importé d'utilisateur` (violet) — si `sourceType='user'`
- Conserver le badge `Promu d'âme` existant pour rétro-compat (équivalent à `sourceType='soul'`).

### 5. Contrôles d'accès

- Les boutons d'import ne s'affichent que si `hasPermission('MANAGE_SERVANTS')` ou `hasPermission('MANAGE_DEPARTMENT_SERVANTS')`.
- Pour un chef de département : `departmentId` forcé sur le sien, non modifiable.
- Pour un admin : sélecteur de département cible obligatoire dans la modale.

### 6. Suppression / désaffectation

Aucun changement bloquant. Supprimer un serviteur n'affecte ni l'âme ni l'utilisateur source (seul le doc `servants` correspondant à ce département est supprimé). La même personne peut rester serviteur ailleurs.

### 7. Changelog & version

- `src/CHANGELOG.md` : entrée v1.7.24 — « Import de serviteurs depuis la liste des âmes et des utilisateurs ; multi-appartenance par département ».
- `src/pages/Login.tsx` : version `1.7.24`.

---

## Fichiers modifiés / créés (récap)

1. `src/types/servant.types.ts` — `sourceType`, `sourceId`
2. `src/services/servant.service.ts` — `importFromSouls`, `importFromUsers`, assouplissement unicité
3. **NOUVEAU** `src/components/servants/ImportServantsModal.tsx` — UI d'import
4. `src/pages/ServantManagement.tsx` — bouton « Importer »
5. `src/components/servants/DepartmentLeaderDashboard.tsx` — bouton « Importer »
6. `src/components/servants/ServantListItem.tsx` — badge source
7. `src/CHANGELOG.md` + `src/pages/Login.tsx` — version 1.7.24

---

## Hors scope (à confirmer si souhaité)

- **Synchronisation bidirectionnelle** : si on modifie le téléphone d'un user, le serviteur lié n'est pas mis à jour automatiquement. On peut l'ajouter plus tard via une Cloud Function ou un trigger applicatif.
- **Suivi unifié** (suivi du serviteur ET de l'âme dans une même fiche) : non couvert ici, à traiter dans un ticket séparé.
- **Désaffecter en masse** d'un département : peut être ajouté dans la même modale en mode « Retirer » si besoin.
