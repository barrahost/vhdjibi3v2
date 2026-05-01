## Objectif

Permettre aux rôles **ADN, Admin et Super Admin** d'importer en masse des âmes via un fichier Excel structuré, avec aperçu, validation ligne par ligne, et téléchargement d'un modèle vierge.

## Comportement attendu

1. Bouton **"Importer Excel"** ajouté à côté de "Ajouter une âme" dans la page `Âmes`, visible uniquement pour `adn`, `admin`, `super_admin` (en tenant compte du profil actif via `activeRole`).
2. Modal en 3 étapes :
   - **Étape 1 — Sélection** : zone de drop / bouton parcourir + lien "Télécharger le modèle".
   - **Étape 2 — Aperçu** : tableau récapitulatif avec statut par ligne (✅ valide, ⚠️ avertissement, ❌ invalide) et compteurs en haut.
   - **Étape 3 — Import** : barre de progression, écriture par batch de 10, résumé final.
3. Téléchargement d'un template `.xlsx` vierge contenant titre/sous-titre (lignes 1-2), en-têtes (ligne 3), 5 lignes d'exemple grisées et listes déroulantes (Genre, Provenance, Famille, Indécise).

## Format du fichier (feuille "Import Âmes", en-têtes ligne 3, données dès la ligne 4)

| Col | Champ | Obligatoire | Mapping Firestore |
|---|---|---|---|
| A | Date 1ère visite (JJ/MM/AAAA) | ✅ | `firstVisitDate` |
| B | Nom complet | ✅ | `fullName` |
| C | Surnom | | `nickname` |
| D | Genre (Homme/Femme) | ✅ | `gender` (male/female) |
| E | Téléphone (10 chiffres) | ✅ | `phone` (préfixé `+225`) |
| F | Lieu d'habitation | ✅ | `location` |
| G | Famille de service | | `serviceFamilyId` (lookup par nom) |
| H | Provenance (Culte/Evangelisation) | | `originSource` |
| I | Âme indécise (Oui/Non) | | `isUndecided` |
| J | Remarques | | (ignoré) |

Champs ajoutés automatiquement : `status: 'active'`, `createdAt`, `updatedAt`, `createdBy`, `spiritualProfile` initialisé à `{ isBornAgain:false, isBaptized:false, isEnrolledInAcademy:false, isEnrolledInLifeBearers:false, departments:[] }`.

## Validations par ligne

- `fullName` non vide
- `gender` ∈ {Homme, Femme}
- `phone` : exactement 10 chiffres
- `firstVisitDate` : date valide JJ/MM/AAAA
- `location` non vide
- Famille (si renseignée) doit exister dans `serviceFamilies` → sinon ⚠️ (importée sans famille)
- Provenance (si renseignée) ∈ {Culte, Evangelisation}
- Doublon de téléphone détecté dans Firestore → ⚠️ (importable mais signalé)

Lignes ❌ ignorées à l'import. Compteurs valides / invalides / avertissements affichés.

## Fichiers à créer / modifier

| Fichier | Action |
|---|---|
| `src/services/soulImport.service.ts` | **Créer** — parsing XLSX, validation, lookup familles, détection doublons, écriture par batch |
| `src/components/souls/ImportSoulsModal.tsx` | **Créer** — modal 3 étapes + génération du template |
| `src/pages/SoulManagement.tsx` | **Modifier** — bouton "Importer Excel" + état `showImportModal` (gardé par rôle) |
| `src/pages/Login.tsx` | Bump version **1.7.30** |
| `src/CHANGELOG.md` | Entrée pour la nouvelle fonctionnalité |

## Détails techniques

- Librairie **`xlsx` (SheetJS)** déjà présente (v0.18.5).
- Lecture : `XLSX.read(arrayBuffer, { type: 'array' })` puis `sheet_to_json(sheet, { header: 1, range: 2 })`.
- Génération template : `XLSX.utils.aoa_to_sheet`, ajout de `!dataValidations` pour les listes déroulantes, styles gris sur exemples.
- Écriture Firestore : `writeBatch` par paquets de 10, `await` séquentiel entre batches pour la barre de progression.
- Lookup familles : un seul `getDocs(collection(db,'serviceFamilies'))` mis en cache (Map name→id, insensible à la casse/accents).
- Détection doublons : un `getDocs` initial sur `souls` pour récupérer la liste des téléphones existants (Set).
- Restriction d'accès : `const canImport = ['adn','admin','super_admin'].includes(activeRole || userRole)`.
- Mobile : modal responsive, tableau d'aperçu scrollable horizontalement, boutons tactiles.

## Maintenance

- Version affichée dans le header → **1.7.30**.
- Entrée changelog : « Ajout de l'import en masse d'âmes depuis un fichier Excel (réservé ADN/Admin/Super Admin) avec téléchargement d'un modèle, aperçu validé ligne par ligne et import par batch. ».
