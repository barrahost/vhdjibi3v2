## Amélioration UX #6 — Mémorisation des filtres

### Problème
Sur la page **Gestion des âmes** (`/souls`), dès qu'un utilisateur quitte la page (clique sur une âme, va au tableau de bord, etc.) puis y revient, tous les filtres sont réinitialisés : recherche, berger sélectionné, plage de dates, statut, page courante, tri. Pour des utilisateurs qui traitent plusieurs âmes en lot, c'est une friction importante.

### Solution
Persister automatiquement l'état des filtres dans `sessionStorage` (donc effacé à la fermeture de l'onglet, mais conservé pendant toute la session) et les restaurer au retour sur la page.

### Comportement attendu
- Au chargement de `/souls`, restaurer : `searchTerm`, `selectedShepherdId`, `dateRange`, `statusFilter`, `sortConfig`, `currentPage`.
- À chaque changement d'un de ces états, sauvegarder dans `sessionStorage`.
- **Exception** : si un paramètre `?filter=...` est présent dans l'URL (venant du widget Actions à traiter), il prend le dessus sur l'état mémorisé.
- Bouton **« Réinitialiser les filtres »** affiché à côté de la barre de recherche dès qu'au moins un filtre est actif. Il efface l'état mémorisé et remet tout à zéro.
- `unassignedFamilyOnly` (filtre via URL) n'est **pas** persisté — c'est un mode contextuel piloté par l'URL.

### Détails techniques

**Fichier principal : `src/pages/SoulManagement.tsx`**

1. Créer un petit hook utilitaire local (ou inline) `usePersistedFilters` qui :
   - Au montage, lit la clé `souls:filters:v1` de `sessionStorage` et hydrate les états.
   - Sérialise les `Date` en ISO string pour `dateRange.start/end`.
   - Écrit dans `sessionStorage` à chaque changement (via un `useEffect` groupé).

2. Ordre d'initialisation :
   - `useState` initialisé via une fonction lazy qui lit `sessionStorage`.
   - L'effet existant qui lit `searchParams.get('filter')` reste prioritaire (s'exécute après).

3. Ajouter un bouton **« Réinitialiser »** (icône `RotateCcw` de lucide-react) visible si :
   `searchTerm || selectedShepherdId || dateRange.start || dateRange.end || statusFilter !== 'active'`
   
   Action : remet les valeurs par défaut + `sessionStorage.removeItem('souls:filters:v1')`.

4. Ne pas persister : `showForm`, `showImportModal`, `editingSoul`, `souls`, `loading`, `unassignedFamilyOnly`.

**Fichier : `src/pages/Login.tsx`**
- Bumper la version à **1.7.36**.

**Fichier : `src/CHANGELOG.md`**
- Ajouter une entrée pour 1.7.36 décrivant la mémorisation des filtres et le bouton de réinitialisation.

### Fichiers modifiés
- `src/pages/SoulManagement.tsx`
- `src/pages/Login.tsx`
- `src/CHANGELOG.md`

Valide ce plan pour que je l'implémente.