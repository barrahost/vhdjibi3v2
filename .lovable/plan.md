

## Donner a Mme ASSOMA la possibilite de supprimer des anniversaires

### Probleme identifie

Actuellement, la suppression d'un anniversaire est reservee exclusivement au `super_admin` (verification codee en dur dans `BirthdayList.tsx`). Meme si Mme ASSOMA a acces au menu Anniversaires, le bouton supprimer ne s'affiche pas pour elle.

### Solution proposee

Creer une permission dediee `MANAGE_BIRTHDAYS` et l'utiliser pour controler l'acces a la suppression. Cela permet d'attribuer cette capacite a n'importe quel utilisateur via les menus additionnels, sans toucher au role `super_admin`.

### Modifications prevues

**1. Ajouter la permission `MANAGE_BIRTHDAYS`**

- **`src/constants/roles.ts`** : Ajouter `MANAGE_BIRTHDAYS: 'MANAGE_BIRTHDAYS'` dans l'objet `PERMISSIONS`
- **`src/types/permission.types.ts`** : Ajouter `'MANAGE_BIRTHDAYS'` dans le type `Permission`

**2. Mettre a jour le menu Anniversaires dans `MenuAssignment`**

- **`src/components/users/MenuAssignment.tsx`** : Changer l'entree "Anniversaires" pour utiliser `PERMISSIONS.MANAGE_BIRTHDAYS` au lieu de `PERMISSIONS.VIEW_STATS`, et mettre a jour la description pour indiquer que cela inclut la suppression

**3. Modifier `BirthdayList.tsx` pour utiliser la nouvelle permission**

- **`src/pages/BirthdayList.tsx`** :
  - Importer `usePermissions`
  - Remplacer la verification `userRole === 'super_admin'` par `hasPermission('MANAGE_BIRTHDAYS')` (ou `super_admin`) aux deux endroits :
    - Ligne 82 : dans `handleDelete` pour autoriser la suppression
    - Ligne 135 : pour afficher la colonne "Actions" avec le bouton supprimer

**4. Re-assigner le menu a Mme ASSOMA**

Apres le deploiement, il faudra re-cocher le menu "Anniversaires" pour Mme ASSOMA dans la gestion des menus utilisateurs, car la permission sauvegardee changera de `VIEW_STATS` a `MANAGE_BIRTHDAYS`.

### Details techniques

- Le `super_admin` conserve automatiquement l'acces (le hook `usePermissions` retourne `true` pour toute permission quand le role est `super_admin`)
- La permission `MANAGE_BIRTHDAYS` sera aussi ajoutee aux permissions du role `admin` dans `ROLE_PERMISSIONS`
- Aucun changement de base de donnees necessaire, la permission est stockee dans le champ `additionalMenus` de Firebase

