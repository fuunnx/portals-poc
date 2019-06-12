Stocker les définitions des portails directement dans le code source

sous la forme de commentaires



Ajouter un bouton pour toggle la vue 2D (portails) de la vue 1D (tradi) + raccourci clavier à choisir

Utiliser le raccourci "pan" à l'aide de la barre d'espace. Comment gérer les conflits avec le focus dans l'éditeur de code ? utiliser `esc` pour blur ? Dans ce cas bien rendre visible état "focus". Et seulement en mode 2D, ou alors seulement en mode "éditable".



Point d'ancrage :

\+ pas besoin de tracker les modifications de position

\- rajoute encore des métadonnées dans le code



Faut-il avoir une mise-en-page "cadrée" en positionnant les éléments sur une grille

ou bien une mise en page beaucoup plus libre, dans ce cas c'est nécessaire d'avoir un "offset X" dans la définition des points d'ancrage



```js
function main() {
    // START #portal1
    function lol () {
      return []
    }
    // END #portal1
	  

    // ANCHOR #portal1 | #portal2
    // ANCHOR #portal3

    'blabla vla'

    // ANCHOR #portal1

    return {

    }
}
```



En mode normal "lecture" :

1- Déterminer la taille des portails et la position des points d'ancrage en parsant le code source (les commentaires doivent pouvoir être paramétrables en fonction du language)

- coordonnées en `(x charactères, y lignes)`
- Si pas d'ancre, pas de portail. 
- Si ancre à la même place que faire ??

2- Faire le rendu du code source en

- laissant des blancs aux points d'ancrages pour laisser passer les portails

- en cachant les zones "portalisées"

- En transformant l'aspect visuel des points d'ancrage et des respères de portails (tout en les gardant éditables)

  

En mode "editable"  (appui sur `cmd` ) :

- Plus possible de sélectionner ni éditer du texte, le code est figé
- Si sélection en cours, en faire un portail

- Possible de drag and drop les portails
  - Si touche alt, création d'un clone
- Possible de fermer un portail ("reset"  à sa position d'origine)
- Possible de "désolidariser" un clone (crée une copie du code source collée juste après l'original)