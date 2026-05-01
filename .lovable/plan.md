# Amélioration #3 — Tri des âmes + charge par berger (Responsable de famille)

Objectif : sur le dashboard du responsable de famille, faire ressortir les âmes à assigner en priorité et donner une vue d'ensemble de la charge de travail de chaque berger.

## Ce qui change pour l'utilisateur (Responsable de famille)

### A. Liste des âmes réorganisée
La section unique « Âmes de la famille » est scindée en **deux sous-sections** :

- **À assigner** (en haut, fond orange clair) — toutes les âmes sans berger.
- **Assignées** (en bas, fond normal) — toutes les âmes ayant un berger.

Les âmes sont triées alphabétiquement dans chaque groupe. Si une sous-section est vide, elle n'apparaît pas. Le sélecteur de berger reste fonctionnel et fait basculer automatiquement l'âme d'un groupe à l'autre.

### B. Nouveau bloc « Répartition des bergers »
Inséré au-dessus de la liste des âmes :

```text
Répartition des bergers
  Kouassi Jean    8 âmes  ████████░░  80%
  Marie Dupont    3 âmes  ███░░░░░░░  30%
  (Non assigné)   4 âmes
```

- Une ligne par berger rattaché à la famille, triée par nombre d'âmes décroissant.
- Barre horizontale proportionnelle au berger le plus chargé (référence = `max`).
- Pourcentage = `count / max`.
- Une ligne finale grise « Non assigné » indique le nombre d'âmes sans berger (sans barre).

Aucune requête supplémentaire : tout est calculé côté client à partir des données déjà chargées (`souls`, `shepherds`).

## Détails techniques

### Fichier : `src/components/dashboard/FamilyLeaderDashboard.tsx`

1. Ajouter trois `useMemo` :
   - `unassignedSouls` : `souls.filter(s => !s.shepherdId)` triées par `fullName`.
   - `assignedSouls` : `souls.filter(s => s.shepherdId)` triées par `fullName`.
   - `shepherdLoad` : tableau `{ id, fullName, count }` (un par berger), trié par `count` décroissant, plus `max` pour la normalisation des barres.

2. Avant la liste des âmes, insérer un bloc « Répartition des bergers » (`bg-white border rounded-lg`). Chaque ligne :
   - nom du berger, nombre d'âmes, barre de progression (`<div>` avec largeur calculée), pourcentage.
   - barre couleur primaire `#00665C`, fond `bg-gray-100`.
   - ligne « Non assigné » en gris sans barre, affichée uniquement si `unassigned > 0`.
   - Si aucun berger n'est rattaché à la famille, ne pas afficher le bloc.

3. Dans la liste des âmes, remplacer le `souls.map(...)` actuel par deux sections successives :
   - En-tête « À assigner (N) » avec fond `bg-amber-50` et bordure inférieure, suivi des `unassignedSouls.map(...)`.
   - En-tête « Assignées (N) » avec fond `bg-gray-50`, suivi des `assignedSouls.map(...)`.
   - La carte d'une âme reste identique à l'existante (mêmes infos, même `<select>` d'assignation).

### Versionnage
- `src/pages/Login.tsx` : version `1.7.32` → `1.7.33`.
- `src/CHANGELOG.md` : nouvelle entrée `[1.7.33] - Tri et charge par berger pour le responsable de famille`.

## Hors périmètre
- Pas de modification du service `FamilyLeaderService`.
- Pas de modification des autres dashboards.
- Pas de changement de schéma Firestore.
