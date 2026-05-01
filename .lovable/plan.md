# Amélioration #2 — Stats cliquables sur le dashboard ADN

Objectif : chaque chiffre clé du dashboard ADN devient un raccourci direct vers la liste filtrée correspondante, afin d'éviter à l'ADN de naviguer manuellement puis de re-filtrer.

## Ce qui change pour l'utilisateur (ADN)

Sur le **Tableau de bord ADN**, les cartes de statistiques deviennent cliquables :

| Carte                              | Action au clic                                       |
|------------------------------------|------------------------------------------------------|
| Âmes actives et non assignées      | Ouvre **Gestion des âmes** filtrée « Non assigné »   |
| Nouvelles âmes (Mois)              | Ouvre **Gestion des âmes** filtrée « 30 derniers jours » |
| Total des âmes indécises           | Ouvre la page **Âmes indécises**                     |

- Apparition d'un libellé **« Voir la liste → »** en bas des cartes cliquables.
- Effet visuel discret au survol (ombre + accent jaune sur la barre gauche), curseur main, focus clavier accessible.
- Les autres cartes (totaux purement informatifs) restent inchangées.

## Détails techniques

### 1. `src/components/dashboard/stats/StatCard.tsx`
Ajouter deux props optionnelles :
- `onClick?: () => void`
- `linkLabel?: string` (ex. « Voir la liste »)

Si `onClick` est fourni :
- la carte devient un élément interactif (`role="button"`, `tabIndex={0}`, gestion `Enter` / `Espace`),
- styles : `cursor-pointer`, `hover:shadow-md`, transition légère sur la bordure gauche,
- affichage de `linkLabel` avec une icône `ArrowRight`.

Le bouton chevron des `details` doit appeler `e.stopPropagation()` pour ne pas déclencher la navigation.

### 2. `src/components/dashboard/ADNDashboard.tsx`
- Importer `useNavigate` de `react-router-dom`.
- Passer `onClick` + `linkLabel` aux 3 cartes ciblées :
  - « Âmes actives et non assignées » → `navigate('/souls?filter=unassigned')`
  - « Nouvelles âmes (Mois) » → `navigate('/souls?filter=this_month')`
  - « Total des âmes indécises » → `navigate('/undecided-souls')` (page dédiée déjà existante)

### 3. `src/pages/SoulManagement.tsx`
- Lire `useSearchParams` au montage.
- Si `filter=unassigned` : appliquer `setSelectedShepherdId('unassigned')` (le filtre existe déjà dans `ShepherdFilter`).
- Si `filter=this_month` : pré-remplir `dateRange.startDate` avec la date d'il y a 30 jours et `dateRange.endDate` avec aujourd'hui (format `YYYY-MM-DD`). Forcer `statusFilter = 'active'` (déjà la valeur par défaut).
- Le paramètre est consommé une seule fois (au premier rendu) pour ne pas écraser les choix manuels ultérieurs de l'utilisateur.

### 4. Versionnage
- `src/pages/Login.tsx` : version `1.7.31` → `1.7.32`.
- `src/CHANGELOG.md` : nouvelle entrée `[1.7.32] - Stats cliquables sur le dashboard ADN`.

## Hors périmètre
- Pas de changement de schéma Firestore.
- Pas de modification des autres dashboards (Berger, Responsable de famille, Admin).
- Pas de filtre URL pour les autres pages (`/undecided-souls` est déjà ciblée et n'a pas besoin de paramètre).
