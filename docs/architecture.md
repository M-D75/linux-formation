# Organisation de l’entraînement

`src/views/Navigations.vue` porte la présentation de l’espace d’entraînement.
Son script est `src/features/training/workspace.js` : il initialise l’état Vue,
assemble les méthodes et conserve les propriétés calculées, observateurs et
hooks de cycle de vie. Les modules restent des méthodes de l’Options API :
Vue les lie à la même instance, ce qui préserve les références, événements et
interactions du tutoriel.

Les comportements sont regroupés dans `src/features/training/` :

- `navigation.js` : position, chemins et déplacement avec `cd`.
- `parsing.js` : arguments et redirections.
- `commands.js` : aide, identité et commandes simples.
- `filesystem.js` : liste, création, copie et suppression.
- `fileContents.js` : lecture, édition et écriture du contenu des fichiers.
- `permissions.js` : calcul et modification des droits.
- `missions.js` : missions, validation des étapes et retours pédagogiques.
- `tree.js` : rendu D3, animations de déplacement et aperçu pendant la saisie.
- `terminal.js` : saisie, exécution, autocomplétion et historique.
- `robot.js` et `audio.js` : assistant et effets sonores.
- `session.js` : contexte participant et synchronisation des événements.
- `badges.js` : récompenses et progression associée.
- `formatting.js` : présentation des textes pédagogiques.
- `workspaceData.js` : constantes et création des arbres initiaux.
- `workspace.scss` et `tree.scss` : styles généraux et styles locaux du graphe.

Les fonctions indépendantes de Vue restent dans `src/services/`.
`directoryNavigation.js` résout et valide le chemin complet sans modifier les
nœuds. Le module de navigation n’engage la nouvelle position et les changements
visuels qu’après cette validation. `treePaths.js` calcule les courbes et les
cibles visibles sans ouvrir de dossier pendant la saisie.

## Vérifications

- `npm test` : chemins visibles, navigation réelle et absence de modification
  de l’espace de travail après un chemin invalide ou un refus de permission.
- `npm run build` : compilation du composant, des modules et des styles.
- `npx eslint src/features/training src/services/directoryNavigation.js tests` :
  analyse des modules extraits et des tests, sans correction automatique.

Cette séparation conserve l’état partagé du composant. Un futur découpage en
sous-composants peut maintenant s’appuyer sur ces domaines sans réécrire en
même temps le moteur des commandes.
