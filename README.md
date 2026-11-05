# NeoScribVisu-BM

Évolution d'une bibliothèque de Gironde, année après année, à partir de l'enquête annuelle du Service du livre et de la lecture (SLL, ministère de la Culture). Remplace le rapport Looker Studio « Tableau BM évolutions ».

Site : https://bibliogironde.github.io/NeoScribVisu-BM/

## Pages

- **Situation actuelle** : fiche d'identité, chiffres clés de l'année choisie (surface et recommandation SLL, horaires, budget, accessibilité, gratuité, SIGB…), part de la population inscrite et emprunteuse, fonds.
- **Évolutions diverses** : personnel, filière culturelle, budget d'acquisition, fréquentation, classes accueillies.
- **Usagers** : nouveaux inscrits et emprunteurs actifs, résidents et par tranche d'âge.
- **Collections : livres** et **autres supports** : fonds, acquisitions, éliminations, budgets.
- **Emprunts** : par support et par public.
- **Calcul de la typologie** : note de 1 à 5 sur les 9 critères, reprise du fichier typologie de l'enquête.

Chaque page s'exporte en PDF (A4 paysage) avec le bouton « Exporter en PDF ». L'adresse de la page (`#page=…&annee=…&bib=LI…`) peut être partagée.

## Données

L'application ne contient aucune donnée : elle lit les fichiers publiés par [NeoScribVisu](https://github.com/biblioGironde/NeoScribVisu) (`https://bibliogironde.github.io/NeoScribVisu/data/`). Les calculs sont donc les mêmes que ceux du tableau de bord départemental, vérifiés contre le Looker d'origine. Pour ajouter une année, il suffit de l'importer dans NeoScribVisu : elle apparaît ici sans autre modification.

Différences avec le Looker d'origine :

- chaque année est affichée séparément (le Looker additionnait les années quand aucun filtre d'année n'était posé, y compris sur la page « Situation actuelle ») ;
- un indicateur absent du questionnaire d'une année est signalé « n.c. », jamais remplacé par zéro ;
- les noms des responsables ne sont pas publiés.

## Développement

Aucune dépendance. `npm start` lance un serveur local sur http://localhost:8080 (données lues sur le site de NeoScribVisu).

Pour tester avec un import local de NeoScribVisu : `npm start -- ../NeoScribVisu/public/data`, puis ouvrir http://localhost:8080/?donnees=donnees/

`public/commun.js` et `public/style.css` sont identiques dans NeoScribVisu-BM et NeoScribVisu-CDC : une correction se reporte dans les deux dépôts. Les pages sont décrites en tête de `public/app.js`.

Le site est publié sur GitHub Pages par la GitHub Action « Publication GitHub Pages » à chaque modification de `public/` sur `main`.

## Licence

Code sous licence MIT. Données : ministère de la Culture, enquête annuelle sur les bibliothèques des collectivités territoriales.
