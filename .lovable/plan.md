## Objectif

Permettre à un **ADN** d'**importer** une âme depuis la liste des **âmes évangélisées** vers la liste des **âmes de l'église** (collection `souls`) le jour où elle vient effectivement au culte. Tant qu'elle n'est pas importée, l'âme évangélisée n'est PAS comptabilisée dans les statistiques de l'église.

## Workflow

1. L'évangéliste enregistre une âme dans `evangelized_souls` (déjà fait).
2. Quand cette personne vient au culte pour la première fois, l'**ADN** ouvre la page **« Âmes évangélisées »** (qu'il peut maintenant voir en lecture).
3. Pour chaque âme non encore importée, un bouton **« Importer comme âme »** ouvre une modale pré-remplie (nom, surnom, genre, téléphone, lieu, date de 1ʳᵉ visite = aujourd'hui par défaut) où l'ADN choisit la **provenance** (par défaut « Évangélisation »), la **famille de service** et le **berger**, puis envoie le SMS de bienvenue comme dans le formulaire `SoulForm` actuel.
4. À la validation : création dans `souls` + marquage de l'âme évangélisée avec `importedToSoulId`, `importedAt`, `importedBy`, `status = 'imported'`.
5. L'âme évangélisée importée reste visible dans la liste des évangélisées avec un **badge « Importée »** mais n'apparaît plus comme « à importer » et reste toujours absente des stats globales église (les stats lisent `souls`).

## Modifications

### Permissions
- `src/types/businessProfile.types.ts` : ajouter `MANAGE_EVANGELIZED_SOULS` à la liste des permissions ADN (lecture/import seulement, pas de création).
- `src/constants/roles.ts` : idem dans `ROLE_PERMISSIONS[ADN]`.

### Collection `evangelized_souls` — champs ajoutés
- `importedToSoulId?: string` — id de l'âme créée dans `souls`
- `importedAt?: Date`
- `importedBy?: string` — uid ADN
- `status: 'active' | 'inactive' | 'imported'`

### Composants nouveaux
- `src/components/evangelizedSouls/ImportToSoulModal.tsx` — modale d'import (clone simplifié de `SoulForm`, avec sélection berger + famille + modèle SMS « Bienvenue »).

### Page `EvangelizedSoulManagement.tsx`
- L'ADN voit la liste **complète** (toutes évangélistes confondus), en lecture seule (pas le bouton « Ajouter »).
- Nouveau filtre : **« État »** = À importer / Importées / Toutes.
- Nouvelle colonne **« État import »** : badge vert « Importée le … par … » ou bouton orange **« Importer »** (visible pour ADN/Admin uniquement).
- L'évangéliste continue de voir uniquement ses âmes, avec le badge d'état import en consultation.

### Distinction visuelle
- En haut de la page « Âmes évangélisées » : message d'info clair — *« Ces âmes ne sont pas comptabilisées parmi les âmes de l'église tant qu'elles n'ont pas été importées par un ADN à leur première visite au culte. »*

## Hors scope (déjà confirmé)
- Pas de double comptage : les statistiques (`GeneralStats`, dashboards) lisent uniquement `souls`. Aucune modification nécessaire.
- Pas de suppression automatique de l'âme évangélisée après import (traçabilité conservée).

## Maintenance
- Bumper version → **1.7.67**
- Mettre à jour `src/CHANGELOG.md`
- Mettre à jour la mémoire `mem://features/permissions`

Approuvez pour que j'implémente.