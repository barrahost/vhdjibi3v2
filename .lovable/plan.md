## Problème

Quand un **responsable de département** ouvre la modale "Importer des serviteurs" depuis la page `/serviteurs` (bouton en haut), le sélecteur "Département cible" s'affiche et lui propose de choisir parmi tous les départements. Or il ne devrait pouvoir importer que dans **son propre département**.

Note : depuis le dashboard "Mon département" (`DepartmentLeaderDashboard`), le `fixedDepartmentId` est déjà bien passé à la modale — ce cas-là fonctionne correctement. Le bug est uniquement sur le bouton de la barre d'en-tête de `ServantManagement`.

## Solution

Sur `src/pages/ServantManagement.tsx`, déterminer le département du responsable connecté à partir de `user.businessProfiles` (profil de type `department_leader`) et le passer en `fixedDepartmentId` à la modale lorsque l'utilisateur n'est **pas** admin (n'a pas `MANAGE_SERVANTS` ni `*`).

Comportement attendu après correction :
- **Admin** : la modale affiche toujours le sélecteur de département cible (comportement inchangé).
- **Responsable de département uniquement** : le sélecteur de département est masqué, le département est verrouillé sur le sien, et seul l'import vers ce département est possible.
- **Responsable de département sans profil `department_leader` valide** : on désactive le bouton "Importer des serviteurs" pour éviter une modale inutilisable.

## Détails techniques

### `src/pages/ServantManagement.tsx`
- Calculer `leaderDepartmentId` :
  ```ts
  const leaderDepartmentId = user?.businessProfiles?.find(
    (p: any) => p.type === 'department_leader' && p.departmentId
  )?.departmentId;
  ```
- Passer à la modale :
  ```tsx
  <ImportServantsModal
    isOpen={showImportModal}
    onClose={() => setShowImportModal(false)}
    fixedDepartmentId={isAdmin ? undefined : leaderDepartmentId}
  />
  ```
- Conditionner le bouton "Importer des serviteurs" : si `!isAdmin && !leaderDepartmentId`, ne pas afficher le bouton (ou le désactiver avec un tooltip).

### Aucun changement nécessaire dans
- `ImportServantsModal.tsx` : déjà correctement câblé pour masquer le sélecteur quand `fixedDepartmentId` est fourni.
- `DepartmentLeaderDashboard.tsx` : déjà correct.

### Maintenance
- Bumper la version à **1.7.27** dans `src/pages/Login.tsx` et `src/CHANGELOG.md` :
  - "Fix : un responsable de département ne peut plus choisir un autre département cible lors de l'import de serviteurs."

## Résultat attendu

Un responsable de département qui clique sur "Importer des serviteurs" depuis la page `/serviteurs` voit la modale s'ouvrir directement sur son département, sans champ "Département cible".
