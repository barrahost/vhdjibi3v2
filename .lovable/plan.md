## Problème

La capture montre que la responsable du département **SOCIAL** (ASSOMA JOCELYNE), connectée avec son profil "Responsable de Département" actif, voit toujours le sélecteur **"Département cible"** dans la modale d'import (préselectionné sur "ACCUEIL", ce qui lui permettrait d'importer des âmes dans un département qui n'est pas le sien).

Le correctif précédent (1.7.27) verrouillait la cible uniquement quand `isAdmin` était `false`. Mais cette utilisatrice possède manifestement aussi la permission `MANAGE_SERVANTS` (ou `*`), donc `isAdmin` est `true` et le verrou ne s'applique pas. De plus, on prenait le premier profil `department_leader` trouvé sans vérifier qu'il s'agit du **profil actif** sélectionné via le sélecteur de profils.

## Solution

Verrouiller la cible d'import sur le département du profil **actuellement actif** dès que ce profil est `department_leader`, indépendamment des autres permissions (admin ou non). Un admin qui agit en tant que responsable de département ne doit pouvoir importer que dans son département. S'il veut importer dans n'importe quel département, il doit basculer sur son profil admin via le sélecteur de profils.

Comportement final :
- **Profil actif = `department_leader`** → champ "Département cible" masqué, verrouillé sur le département du profil actif (même si l'utilisateur a `MANAGE_SERVANTS`).
- **Profil actif = admin / autre, sans profil `department_leader`** → sélecteur affiché normalement.
- **Profil actif = admin / autre, mais l'utilisateur a aussi un profil `department_leader`** → comportement par défaut admin (sélecteur visible) ; pour importer dans son département, il doit basculer sur son profil de responsable.

## Détails techniques

### `src/pages/ServantManagement.tsx`
Remplacer le bloc actuel par :
```ts
const activeProfile = (user as any)?.businessProfiles?.find((p: any) => p.isActive);
const isActingAsDepartmentLeader =
  activeProfile?.type === 'department_leader' && !!activeProfile?.departmentId;

const leaderDepartmentId = isActingAsDepartmentLeader
  ? (activeProfile.departmentId as string)
  : undefined;

const canShowImportButton =
  isAdmin || (canManageDepartmentServants && !!leaderDepartmentId);
```
Et passer à la modale :
```tsx
<ImportServantsModal
  isOpen={showImportModal}
  onClose={() => setShowImportModal(false)}
  fixedDepartmentId={isActingAsDepartmentLeader ? leaderDepartmentId : undefined}
/>
```

### Maintenance
- Bumper la version à **1.7.28** dans `src/pages/Login.tsx` et `src/CHANGELOG.md` :
  - "Fix : la cible d'import est désormais verrouillée sur le département du profil actif lorsqu'on agit en tant que responsable de département (y compris pour les utilisateurs ayant aussi des droits admin)."

## Résultat attendu

ASSOMA JOCELYNE, connectée avec son profil "Responsable de Département" SOCIAL actif, ouvre "Importer des serviteurs" → la modale s'ouvre directement sur le département SOCIAL, sans champ "Département cible" sélectionnable.
