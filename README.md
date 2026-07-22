# CineTrack

Catalogue et suivi personnel de films & séries — projet HTML / CSS / JavaScript
(cf. `CineTrack_Cahier_des_charges.pdf`).

## Lancer le projet

Aucune installation, aucun compte, aucune clé API : c'est du HTML/CSS/JS pur,
sans build, et le catalogue est **embarqué directement dans le projet**
(`js/data.js`). Il suffit d'ouvrir `index.html` dans un navigateur
(double-clic, ou une extension type "Live Server" si vous préférez).

> Le cahier des charges prévoyait un branchement sur l'API TMDB. Pour éviter
> de dépendre d'un compte externe et d'une clé API, ce catalogue a été
> remplacé par un jeu de données local d'une quarantaine de films et séries
> réels (titre, année, genres, note, synopsis, casting). Toute la logique
> (recherche, filtres, tri, fiche détaillée, watchlist) fonctionne à
> l'identique ; seule la source des données change. `js/api.js` isole cette
> différence : si vous voulez un jour rebrancher une vraie API, c'est le
> seul fichier à modifier.

## Structure du projet

```
cinetrack/
├── index.html          Structure de la page (header, filtres, grille, modale)
├── css/
│   └── style.css        Habillage complet, thème "salle de cinéma"
├── js/
│   ├── data.js            Catalogue local (films + séries, données réelles)
│   ├── storage.js         Persistance localStorage (watchlist, déjà-vu, notes)
│   ├── api.js               Couche d'accès aux données (lit data.js)
│   ├── ui.js                  Génération dynamique du DOM (cartes, modale)
│   └── app.js                  Logique principale : recherche/filtres/tri (client-side),
│                                onglets, gestion de la modale de détail
└── README.md
```

Cette séparation correspond au découpage à 4 proposé dans le cahier des
charges (HTML/API — CSS — logique JS — watchlist/notation/localStorage) :
chaque fichier peut être attribué à un membre différent.

## Fonctionnalités livrées

- Catalogue local (films + séries réels, aucun compte ni clé requise),
  affiché en grille de cartes générées dynamiquement, avec affiches de
  substitution stylisées (dégradé + icône).
- Recherche par titre, filtres (type, genre, année, note minimale) et tri
  (popularité / note / date), **entièrement côté client** une fois le
  catalogue chargé — aucun rechargement de page.
- Fiche détaillée en modale : synopsis, casting, durée/saisons, genres.
- Listes personnelles "À voir" et "Déjà vu", avec notation (1 à 5), stockées
  dans `localStorage` selon la structure du cahier des charges
  (`id`, `titre`, `type`, `statut`, `note_perso`, `date_ajout`).
- Interface responsive (mobile / tablette / desktop).

## Pistes bonus (non implémentées, cf. section 10 du cahier des charges)

Mode clair, recommandations par genre, statistiques de visionnage — la
structure du code (données normalisées + rendu séparé de la logique) est
pensée pour les accueillir facilement si le temps le permet.
