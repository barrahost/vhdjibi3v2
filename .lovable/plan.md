## Objectif

Permettre à un chef de département (et à l'admin) d'ajouter un nouveau serviteur **manuellement** depuis le modal d'import, lorsque la personne n'existe ni dans la liste des âmes ni dans celle des utilisateurs. Garantir aussi qu'une même personne puisse être serviteur dans plusieurs départements sans blocage.

## Contexte

Actuellement :
- `ImportServantsModal` permet seulement d'importer depuis Âmes / Utilisateurs (pas de saisie manuelle).
- `ServantForm.tsx` (création manuelle) est **uniquement accessible aux admins** (`MANAGE_SERVANTS`) depuis `/serviteurs`, jamais aux chefs de département.
- `ServantForm.tsx` contient encore d'anciennes règles d'**unicité globale** sur `phone` et `email` qui empêchent une même personne d'être serviteur dans plusieurs départements (alors que `ServantService.createServant` a déjà été corrigé pour scoper l'unicité au département).

## Changements

### 1. Corriger `ServantForm.tsx` (unicité scopée au département)

- Remplacer les requêtes `where('phone', ...)` et `where('email', ...)` globales par des vérifications **scopées au `departmentId` sélectionné** (cohérent avec `ServantService.createServant`).
- Refactorer le `handleSubmit` pour utiliser directement `ServantService.createServant({ ..., sourceType: 'manual' })` au lieu de `addDoc` brut, afin de centraliser la logique et éviter les divergences.

### 2. Ajouter un onglet "Nouveau serviteur" dans `ImportServantsModal.tsx`

Le modal aura désormais 3 onglets :
1. Depuis les âmes (existant)
2. Depuis les utilisateurs (existant)
3. **Nouveau** : Créer manuellement

L'onglet "Créer manuellement" contient un formulaire compact :
- Nom et prénoms (obligatoire)
- Surnom (optionnel)
- Genre (radio H/F)
- Téléphone (+225, validé)
- Email (optionnel)
- Sélecteur de département : pré-rempli et **verrouillé** quand le modal est ouvert depuis le `DepartmentLeaderDashboard` (prop `fixedDepartmentId`), sinon libre pour l'admin
- Case "Responsable de département" (visible uniquement pour les admins via `MANAGE_SERVANTS`)

À la soumission : appel `ServantService.createServant({ ..., sourceType: 'manual', sourceId: null })`. Toast de succès, fermeture du modal.

### 3. Vérifier le flux multi-département

- L'unicité phone/email est déjà scopée au département dans le service après les changements (cf. point 1).
- L'import depuis Âmes/Utilisateurs vérifie déjà `sourceId + departmentId` → la même âme peut être importée dans plusieurs départements distincts.
- Aucun changement de schéma nécessaire.

### 4. Maintenance

- Bump version `1.7.25` dans `src/CHANGELOG.md` et `src/pages/Login.tsx`.
- Entrée changelog : "Création manuelle de serviteurs depuis le modal d'import (chefs de département inclus). Unicité téléphone/email désormais scopée au département."

## Fichiers modifiés

- `src/components/servants/ImportServantsModal.tsx` — nouvel onglet "Créer manuellement"
- `src/components/servants/ServantForm.tsx` — unicité scopée au département, utilise `ServantService`
- `src/CHANGELOG.md`
- `src/pages/Login.tsx` (version)

## Hors-scope

- Aucune migration de données.
- Pas de changement aux permissions existantes — les chefs de département accèdent déjà à `ImportServantsModal` via leur dashboard.
