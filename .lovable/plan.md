## Problème

Dans la page **Âmes**, le filtre "Berger" n'affiche pas tous les bergers. La cause :

`src/components/souls/ShepherdSelect.tsx` interroge Firestore uniquement sur le champ legacy `role` :
```ts
where('role', 'in', ['shepherd', 'intern'])
```

Or, depuis la migration vers les profils métier, beaucoup d'utilisateurs ont leur statut de berger défini uniquement dans `businessProfiles` (avec `role` à `member` ou autre). Ils sont donc invisibles dans le sélecteur et le filtre.

Le hook `useUsersByProfile` gère déjà correctement les deux systèmes (legacy `role` + `businessProfiles`).

## Correction

### 1. `src/components/souls/ShepherdSelect.tsx`
Remplacer la requête actuelle par une logique hybride :
- Charger tous les utilisateurs `status === 'active'`.
- Filtrer côté client : un utilisateur est berger/stagiaire si
  - `role === 'shepherd'` ou `role === 'intern'`, **OU**
  - `businessProfiles` contient un profil actif de type `shepherd` ou `intern`.
- Conserver le tri alphabétique sur `fullName`.
- Garder le libellé "(Stagiaire)" si l'utilisateur est stagiaire (via legacy role ou via businessProfiles).

### 2. Vérifier les autres filtres "Berger" éventuels
Rechercher dans `src/pages/Souls*` et `src/components/souls/` un éventuel deuxième endroit qui charge la liste des bergers pour le filtre de la page (souvent un `<select>` séparé du `ShepherdSelect`). Si trouvé, appliquer la même logique hybride (idéalement via `useUsersByProfile(['shepherd','intern'])`).

### 3. Maintenance
- Bump version → **1.7.63** dans `src/pages/Login.tsx`.
- Entrée dans `src/CHANGELOG.md` : *"Correction : le sélecteur et le filtre Berger affichent désormais tous les bergers (legacy `role` + `businessProfiles`)."*

## Détails techniques

```ts
const snap = await getDocs(
  query(collection(db, 'users'), where('status', '==', 'active'))
);

const shepherds = snap.docs
  .map(d => ({ id: d.id, ...d.data() } as any))
  .filter(u => {
    const fromRole = u.role === 'shepherd' || u.role === 'intern';
    const fromProfiles = (u.businessProfiles || []).some(
      (p: any) => (p.type === 'shepherd' || p.type === 'intern') && p.isActive !== false
    );
    return fromRole || fromProfiles;
  })
  .map(u => {
    const isIntern =
      u.role === 'intern' ||
      (u.businessProfiles || []).some((p: any) => p.type === 'intern');
    return { id: u.id, fullName: u.fullName, role: isIntern ? 'intern' : 'shepherd' };
  })
  .sort((a, b) => a.fullName.localeCompare(b.fullName));
```

Aucun changement de schéma ni de règles Firestore requis.