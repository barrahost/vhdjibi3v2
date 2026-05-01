# Correction de l'import de serviteurs

## Problème

Quand on ouvre l'onglet **"Depuis les âmes"** (ou **"Depuis les utilisateurs"**) dans la modale "Importer des serviteurs", la liste reste vide et le toast **"Erreur lors du chargement"** apparaît.

La cause exacte vient des logs de la console :

```
FirebaseError: The query requires an index.
```

Les requêtes utilisées dans `ImportServantsModal.tsx` combinent :
- `where('status', '==', 'active')`
- `orderBy('fullName')`

Cette combinaison nécessite un **index composite Firestore** qui n'existe pas, donc Firestore rejette la requête et aucune âme/utilisateur n'est chargé.

## Solution

Supprimer le `orderBy('fullName')` de la requête Firestore et trier les résultats côté client (en JavaScript). La liste est de toute façon entièrement chargée en mémoire pour la recherche, donc le tri local est instantané et évite d'avoir à créer un index Firestore.

## Changements

### `src/components/servants/ImportServantsModal.tsx`
- Retirer `orderBy` de l'import et des deux requêtes (`souls` et `users`).
- Trier `souls` et `users` par `fullName` en JS après récupération (`localeCompare`, insensible à la casse/aux accents).

### Maintenance
- Bumper la version à **1.7.26** dans `src/pages/Login.tsx` et `src/CHANGELOG.md` avec une entrée :
  - "Fix: import des serviteurs depuis les âmes / utilisateurs (suppression de la dépendance à un index Firestore)."

## Résultat attendu

Les onglets "Depuis les âmes" et "Depuis les utilisateurs" affichent à nouveau la liste des personnes disponibles, triées par nom, sans erreur.
