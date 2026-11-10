# 🗺️ Cartographe — outil d'état de l'art

Un outil libre et local pour construire un **état de l'art** sans se perdre, inspiré de
[Gargantext](https://gargantext.org) (CNRS/ISC-PIF) : on dépose des sources, on les classe
par thèmes, et l'outil dessine une **carte des thèmes** (graphe de co-occurrences)…
puis va un cran plus loin que Gargantext : il identifie les **angles morts** — les croisements
de thèmes que votre corpus ne couvre pas encore, c'est-à-dire vos angles d'attaque potentiels
pour l'écriture.

Pensé pour un usage fluide et sans friction (notamment TDAH-friendly) :
**on dépose d'abord, on classe ensuite** — rien ne se perd, tout passe par la boîte de tri.

## Démarrer

Aucune installation, aucun serveur, aucun compte :

1. Téléchargez ou clonez ce dépôt.
2. Ouvrez `index.html` dans un navigateur (Chrome, Firefox, Edge…).
3. À la première visite, un tutoriel s'affiche : cliquez « Charger le corpus
   du tutoriel » pour voir l'outil en action, puis explorez les onglets
   **Carte** et **Angles morts**. (Le bouton « ❓ Tutoriel » le rouvre à tout moment.)

L'outil est **neutre** : il fonctionne pour n'importe quel sujet. Le corpus du
tutoriel, lui, reconstitue l'état de l'art d'un mémoire réel — *les outils
numériques et la mise en avant des créateurs de mode africaine*, cartographié à
l'origine avec Gargantext. Il sert aussi de démonstration par l'exemple : une
fois chargé, l'onglet Angles morts fait ressortir le croisement
« outils numériques × mode africaine »… qui était précisément le sujet de ce mémoire.

Les données restent **dans votre navigateur** (localStorage). Rien ne part sur un serveur.

> 💡 Pour un accès en ligne, activez GitHub Pages sur ce dépôt
> (Settings → Pages → branche principale) : l'outil sera servi tel quel.

## Les cinq onglets

| Onglet | Rôle |
|---|---|
| **📥 Capture** | Déposer vite : collage libre, fichier `.bib` (Zotero/Mendeley), formulaire détaillé. Les sources non classées atterrissent dans la **boîte de tri**, avec des **thèmes suggérés** extraits automatiquement du titre et du résumé. |
| **📚 Sources** | Toutes les ressources, filtrables par thème, statut de lecture (à lire / lu / exploité) et importance. |
| **🕸️ Carte** | Le graphe des thèmes façon Gargantext : taille = nombre de sources, liens = co-occurrences, couleurs = familles détectées automatiquement. Clic sur un nœud : renommer, **fusionner** ou supprimer un thème, voir ses sources. Export SVG. |
| **🎯 Angles morts** | Le cœur de l'outil : les paires de thèmes documentés séparément mais **jamais croisés par une source**, classées par potentiel. Les « ponts entre familles » (deux grappes distinctes du corpus) sont les angles les plus originaux. Une matrice de croisements complète la lecture. |
| **📊 Tableau de bord** | Avancement : volume, lecture, répartition par thème et par décennie. |

## Sauvegarde et partage

- **Exporter** (barre du haut) télécharge un fichier JSON : c'est votre sauvegarde,
  et le moyen de passer d'un ordinateur à l'autre.
- **Importer** accepte ce JSON (remplacement ou fusion) ainsi que des fichiers BibTeX.
- ⚠️ Le localStorage peut être effacé par un nettoyage du navigateur :
  **exportez régulièrement**.

## Comment lire les « angles morts »

L'outil signale qu'une intersection est *vide*, pas qu'elle est *pertinente*.
Une case vide peut l'être parce que personne n'a eu l'idée — ou parce que l'idée
est mauvaise. Les trois types :

- **Intersection vide** — deux thèmes documentés (≥ 2 sources chacun), zéro source commune.
- **Pont entre familles** — idem, mais entre deux grappes thématiques distinctes du corpus :
  statistiquement les angles les plus féconds (« trous structuraux »).
- **Croisement marginal** — le lien existe mais repose sur une seule source : fragile, à creuser.

La qualité de l'analyse dépend de la **discipline de classement** : des thèmes
cohérents (fusionnez les doublons via la Carte !) donnent des angles morts fiables.

## Limites assumées

- Pas de moissonnage automatique des bases (HAL, Istex, Scopus…) comme Gargantext :
  les sources entrent par collage, formulaire ou BibTeX.
- L'extraction de termes est volontairement simple (fréquences + bigrammes, stoplistes FR/EN),
  pas un vrai traitement linguistique : les suggestions aident, l'humain tranche.
- Mono-utilisateur, par conception : les données vivent dans le navigateur.

## Technique

HTML/CSS/JS sans build ni dépendance externe — [D3.js v7](https://d3js.org) est embarqué
dans `vendor/` (licence ISC). Structure :

```
index.html        — structure des cinq onglets
css/style.css     — tokens de design (modes clair et sombre)
js/store.js       — données + localStorage + import/export
js/analysis.js    — extraction de termes, co-occurrences, communautés, angles morts
js/bibtex.js      — analyseur BibTeX tolérant
js/graph.js       — carte des thèmes (force layout D3)
js/app.js         — interface
js/sample.js      — corpus du tutoriel
```
