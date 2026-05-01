## Objectif

Restreindre les champs **"Provenance de l'âme"** et **"Famille de service"** en lecture seule pour tous les rôles, sauf `adn`, `admin`, et `super_admin`, dans l'onglet d'édition d'une âme.

## Fichier modifié

### `src/components/souls/tabs/GeneralInfoTab.tsx`

1. **Ajouter `canEditAdnFields`** juste après `isAdnOnly` (ligne 41) :
   ```ts
   const canEditAdnFields =
     activeRole === 'admin' || activeRole === 'super_admin' ||
     userRole === 'admin' || userRole === 'super_admin' ||
     isAdnOnly;
   ```

2. **Bloquer les radios `originSource`** (lignes 145-166) :
   - Ajouter `disabled={!canEditAdnFields}` sur chaque `<input type="radio">`.
   - `onChange` n'applique le changement que si `canEditAdnFields`.
   - Classes dynamiques : `cursor-pointer` si éditable, sinon `cursor-not-allowed opacity-60`.

3. **Texte d'aide sous les radios** (ligne 169) :
   ```tsx
   {canEditAdnFields ? "Précisez d'où vient cette âme" : "Défini par l'ADN — lecture seule"}
   ```

4. **Bloquer le `<select>` famille de service** (lignes 178-183) :
   - `disabled={loadingFamilies || !canEditAdnFields}`
   - Ajouter classes `bg-gray-50 cursor-not-allowed` quand `!canEditAdnFields`.

5. **Texte d'aide sous le select** (lignes 189-193) :
   ```tsx
   {!canEditAdnFields
     ? "Défini par l'ADN — lecture seule"
     : isAdnOnly
       ? "Le responsable de famille assignera ensuite l'âme à un berger"
       : "Optionnel : assigner l'âme à une famille de service"}
   ```

## Maintenance

- Bump version à **1.7.29** dans `src/pages/Login.tsx`.
- Ajouter une entrée dans `src/CHANGELOG.md` : "Fix : les champs Provenance et Famille de service sont désormais en lecture seule pour les bergers, responsables de famille et responsables de département (modifiables uniquement par ADN/admin/super_admin)."

## Comportement attendu

| Rôle | Provenance | Famille de service |
|---|---|---|
| `adn` | Modifiable | Modifiable |
| `admin` / `super_admin` | Modifiable | Modifiable |
| `shepherd` | Lecture seule | Lecture seule |
| `family_leader` | Lecture seule | Lecture seule |
| `department_leader` | Lecture seule | Lecture seule |
