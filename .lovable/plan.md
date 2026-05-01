# Amélioration #4 — Fiche récapitulative après ajout d'une âme

Objectif : remplacer le simple toast par une carte de confirmation visible et actionnable, qui rappelle ce qui a été enregistré et propose d'enchaîner.

## Ce qui change pour l'utilisateur (ADN)

Après avoir cliqué sur **« Ajouter une âme »** et que l'enregistrement réussit :

- Le formulaire **disparaît** et est remplacé par une **carte de confirmation** sur la même page :

```text
✅ Âme enregistrée avec succès !
─────────────────────────────────────
Nom        : Lago Grâce Victoire
Surnom     : Grâce            (si renseigné)
Téléphone  : +225 0707000001  (si renseigné)
Famille    : Arbre de vie     (si renseignée)
Provenance : Culte
SMS de bienvenue : Envoyé ✓ / Non envoyé ⚠

[ + Enregistrer une autre âme ]   [ Voir la liste ]
```

- **« + Enregistrer une autre âme »** : revient au formulaire vide.
- **« Voir la liste »** : navigue vers `/souls`.

Si le SMS n'a pas pu être envoyé (crédit insuffisant), la ligne « SMS de bienvenue » l'indique clairement, mais l'âme reste enregistrée.

## Détails techniques

### Fichier : `src/components/souls/SoulForm.tsx`

1. Nouvel état local :
   ```ts
   const [lastAddedSoul, setLastAddedSoul] = useState<{
     fullName: string;
     nickname?: string;
     phone?: string;
     serviceFamilyName?: string;
     originSource?: 'culte' | 'evangelisation';
     smsSent: boolean;
   } | null>(null);
   ```

2. Importer `useServiceFamilies` (`../../hooks/useServiceFamilies`) pour résoudre `serviceFamilyId` → nom lisible (utilisé uniquement pour l'affichage de la confirmation).

3. À la fin de `handleSubmit` (cas succès), au lieu d'appeler `toast.success` puis de réinitialiser uniquement `formData`, faire :
   - `setLastAddedSoul({ ... smsSent: true/false })`
   - réinitialiser `formData` et `selectedTemplate` comme aujourd'hui.
   - Conserver le `toast.success` court pour le feedback immédiat.

4. Dans le cas « crédit SMS insuffisant », passer `smsSent: false` et tout de même afficher la fiche de confirmation (l'âme est bien créée).

5. Rendu conditionnel : si `lastAddedSoul` est non-null, retourner la carte de confirmation à la place du `<form>`.

6. Carte de confirmation :
   - Style cohérent : `bg-white border rounded-lg shadow-sm p-6`, bandeau de succès vert clair (`bg-green-50 border-green-200`), icône `CheckCircle2`.
   - Liste des informations en `<dl>` (responsive : empilé en mobile, deux colonnes en sm+).
   - Deux boutons en bas : « + Enregistrer une autre âme » (primaire `#00665C`) qui fait `setLastAddedSoul(null)`, et « Voir la liste » (secondaire) qui fait `useNavigate()` vers `/souls`.
   - Les champs vides (surnom, téléphone, famille) ne sont pas affichés.

### Versionnage
- `src/pages/Login.tsx` : `1.7.33` → `1.7.34`.
- `src/CHANGELOG.md` : entrée `[1.7.34] - Fiche récapitulative après ajout d'une âme`.

## Hors périmètre
- Pas de modification du flow d'envoi SMS ni de la création Firestore.
- Pas de changement sur la modale d'édition (`EditSoulModal`).
- Pas de modification du schéma de données.
