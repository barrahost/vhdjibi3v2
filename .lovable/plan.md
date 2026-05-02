## Objectif

Ajouter un nouveau profil métier **Évangéliste** capable d'enregistrer une nouvelle catégorie d'âme — **« Âme évangélisée »** — stockée dans une **collection Firestore séparée** (`evangelized_souls`), avec sa propre liste, ses propres stats et son propre flux de travail (similaire à la gestion ADN, mais cloisonné).

## Modèle de données

Nouvelle collection Firestore : **`evangelized_souls`**

Mêmes champs que `souls` (fullName, nickname, gender, phone, location, coordinates, firstVisitDate, photoURL, spiritualProfile, status, isUndecided, serviceFamilyId, shepherdId, createdAt/By, updatedAt) **plus** :
- `evangelistId` : id de l'évangéliste créateur (obligatoire)
- `evangelizationDate` : date d'évangélisation
- `evangelizationLocation` : lieu d'évangélisation (optionnel, distinct de l'adresse)

Pas de champ `originSource` (toutes les âmes ici sont par définition évangélisées).

## Nouveau profil métier

`src/types/businessProfile.types.ts` — ajouter `'evangelist'` :
- Label : **« Évangéliste »**
- Description : « Peut enregistrer et suivre les âmes évangélisées »
- Permissions (mêmes que ADN, mais portant sur sa propre liste) :
  - `MANAGE_EVANGELIZED_SOULS` (nouvelle permission)
  - `MANAGE_INTERACTIONS`, `MANAGE_SMS`, `EXPORT_DATA`, `MANAGE_PROFILE`, `VIEW_REPLAY_TEACHINGS`

`src/constants/roles.ts` — ajouter :
- `ROLES.EVANGELIST = 'evangelist'`
- `PERMISSIONS.MANAGE_EVANGELIZED_SOULS`
- Bloc `ROLE_PERMISSIONS[EVANGELIST]`
- Étendre les permissions Admin et Super Admin pour inclure `MANAGE_EVANGELIZED_SOULS`

`src/utils/roleHelpers.ts` — ajouter `isEvangelistUser()`.

`src/components/users/BusinessProfileAssignment.tsx` — ajouter `'evangelist'` dans `availableProfileTypes` (ainsi visible dans la modale d'édition utilisateur).

## Pages & composants à créer

**`src/pages/EvangelizedSoulManagement.tsx`** (clone allégé de `SoulManagement.tsx`)
- Lit/écrit dans `evangelized_souls`
- Filtre serveur : si l'utilisateur est **Évangéliste** (et pas Admin), `where('evangelistId', '==', currentUserId)` → ne voit QUE ses âmes
- Si Admin/Super Admin : voit tout
- Filtres locaux : recherche, dates, statut
- Actions : ajouter, modifier, supprimer, exporter Excel

**`src/components/evangelizedSouls/EvangelizedSoulForm.tsx`** (clone allégé de `SoulForm.tsx`)
- Champs : identité, téléphone, lieu, date d'évangélisation, lieu d'évangélisation
- Pas de sélection de berger ni de famille de service (peut être ajouté plus tard)
- SMS de bienvenue optionnel (catégorie `Bienvenue`)
- À la création : `evangelistId = currentUser.id`

**`src/components/evangelizedSouls/EditEvangelizedSoulModal.tsx`** — édition simple inline.

## Routage & navigation

**`src/App.tsx`** — nouvelle route protégée :
```tsx
<Route path="ames-evangelisees" element={
  <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_EVANGELIZED_SOULS]}>
    <EvangelizedSoulManagement />
  </PrivateRoute>
} />
```

**Menu latéral** (`src/components/ui/Sidebar.tsx` ou équivalent) — ajouter l'entrée **« Âmes évangélisées »** (icône `HeartHandshake` ou `Megaphone`), visible si `hasPermission(MANAGE_EVANGELIZED_SOULS)`.

**Dashboard** — option : ajouter un widget « Mes âmes évangélisées » sur le dashboard si l'utilisateur a le profil Évangéliste (à confirmer plus tard si besoin).

## Sécurité / cloisonnement

- Filtrage côté requête Firestore par `evangelistId` pour les évangélistes purs.
- L'écran `SoulManagement` (`/ames`) reste inchangé — les âmes évangélisées **ne s'y mélangent pas** (collection distincte).
- L'ADN ne voit pas les âmes évangélisées (pas de permission `MANAGE_EVANGELIZED_SOULS` accordée).
- Les filtres de bergers existants ne sont pas concernés (les âmes évangélisées n'ont pas de berger pour l'instant).

## Maintenance

- Bumper version à **1.7.66** (`src/pages/Login.tsx` + `package.json` si versionné)
- Mettre à jour `src/CHANGELOG.md`
- Mettre à jour la mémoire `mem://features/permissions` pour ajouter le profil Évangéliste

## Hors scope (à proposer après)

- Promotion d'une âme évangélisée → âme classique (workflow ADN)
- Statistiques globales mixant âmes ADN + évangélisées
- Carte / interactions / rappels dédiés aux âmes évangélisées (réutilisation possible plus tard)
- Migration de données existantes

Approuvez pour que j'implémente.